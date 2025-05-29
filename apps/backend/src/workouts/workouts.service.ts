import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, MoreThanOrEqual, IsNull } from 'typeorm';

import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutSet } from './entities/workout-set.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import { User } from '../users/entities/user.entity';
import { Routine } from '../routines/entities/routine.entity';

import { CreateWorkoutSessionDto, WorkoutType } from './dto/create-workout-session.dto';
import { CreateWorkoutSetDto } from './dto/create-workout-set.dto';

import { calcVolume } from '../common/utils/volume.util';
import { PersonalRecordsService } from '../personal-records/personal-records.service';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet)
    private readonly setRepo: Repository<WorkoutSet>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Routine)
    private readonly routineRepo: Repository<Routine>,
    private readonly dataSource: DataSource,
    private readonly prSvc: PersonalRecordsService,
  ) {}

  async startSession(dto: CreateWorkoutSessionDto) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: dto.userId } });
      if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

      const activeSession = await manager.findOne(WorkoutSession, {
        where: {
          user: { id: dto.userId },
          endTime: IsNull(),
        },
      });

      if (activeSession) {
        throw new BadRequestException('이미 진행 중인 운동 세션이 있습니다.');
      }

      if (dto.routineId) {
        const routine = await manager.findOne(Routine, {
          where: { id: dto.routineId },
          relations: ['creator'],
        });

        if (!routine) {
          throw new NotFoundException('루틴을 찾을 수 없습니다.');
        }

        if (!routine.isPublic && routine.creator?.id !== dto.userId) {
          throw new BadRequestException('이 루틴에 접근할 권한이 없습니다.');
        }
      }

      const session = manager.create(WorkoutSession, {
        user,
        routine: dto.routineId ? ({ id: dto.routineId } as any) : null,
        startTime: dto.startTime ?? new Date(),
        totalVolume: 0,
        pausedIntervals: [],
        totalPausedTime: 0,
      });
      
      return manager.save(session);
    });
  }

  async pauseSession(sessionId: number) {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(WorkoutSession, { 
        where: { id: sessionId } 
      });
      
      if (!session || session.endTime) {
        throw new BadRequestException('유효하지 않은 세션입니다.');
      }
      
      if (!session.pausedIntervals) session.pausedIntervals = [];
      
      const lastPause = session.pausedIntervals[session.pausedIntervals.length - 1];
      if (lastPause && !lastPause.resumedAt) {
        throw new BadRequestException('세션이 이미 일시정지 상태입니다.');
      }
      
      session.pausedIntervals.push({ pausedAt: new Date(), resumedAt: undefined });
      
      return manager.save(session);
    });
  }

  async resumeSession(sessionId: number) {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(WorkoutSession, { 
        where: { id: sessionId } 
      });
      
      if (!session || session.endTime) {
        throw new BadRequestException('유효하지 않은 세션입니다.');
      }
      
      if (!session.pausedIntervals || session.pausedIntervals.length === 0) {
        throw new BadRequestException('세션이 일시정지 상태가 아닙니다.');
      }
      
      const lastPause = session.pausedIntervals[session.pausedIntervals.length - 1];
      if (lastPause.resumedAt) {
        throw new BadRequestException('세션이 일시정지 상태가 아닙니다.');
      }
      
      lastPause.resumedAt = new Date();
      const pauseDuration = lastPause.resumedAt.getTime() - lastPause.pausedAt.getTime();
      session.totalPausedTime += Math.floor(pauseDuration / 1000);
      
      return manager.save(session);
    });
  }

  async addSet(dto: CreateWorkoutSetDto) {
    if (dto.weight > 500) {
      throw new BadRequestException('무게는 500kg를 초과할 수 없습니다.');
    }
    if (dto.reps > 100) {
      throw new BadRequestException('반복 횟수는 100회를 초과할 수 없습니다.');
    }

    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(WorkoutSession, {
        where: { id: dto.sessionId },
        relations: ['workoutSets', 'workoutSets.exercise', 'user'],
      });
      
      if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');
      if (session.endTime) {
        throw new BadRequestException('세션이 이미 종료되었습니다.');
      }

      const exercise = await manager.findOne(Exercise, { where: { id: dto.exerciseId } });
      if (!exercise) throw new NotFoundException('운동을 찾을 수 없습니다.');

      const lastSetOfExercise = session.workoutSets
        ?.filter(set => set.exercise.id === dto.exerciseId)
        .sort((a, b) => b.setNumber - a.setNumber)[0];

      const setNumber = dto.setNumber ?? (lastSetOfExercise ? lastSetOfExercise.setNumber + 1 : 1);
      const volume = calcVolume(dto.reps, dto.weight);

      const set = manager.create(WorkoutSet, {
        workoutSession: session,
        exercise,
        setNumber,
        reps: dto.reps,
        weight: dto.weight,
        volume,
      });
      const savedSet = await manager.save(set);

      session.totalVolume += volume;
      await manager.save(session);

      await this.prSvc.updateRecord(
        session.user.id,
        exercise.id,
        dto.weight,
        dto.reps,
      );

      return savedSet;
    });
  }

  async finishSession(id: number, endTime?: string) {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(WorkoutSession, {
        where: { id },
        relations: ['workoutSets'],
      });
      
      if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');
      if (session.endTime) {
        throw new BadRequestException('세션이 이미 종료되었습니다.');
      }
      if (!session.startTime) {
        throw new BadRequestException('세션 시작 시간이 없습니다.');
      }
      if (session.workoutSets?.length === 0) {
        throw new BadRequestException('운동 기록이 없는 세션은 종료할 수 없습니다.');
      }

      const finishedAt = endTime ? new Date(endTime) : new Date();
      
      if (finishedAt <= session.startTime) {
        throw new BadRequestException('종료 시간은 시작 시간 이후여야 합니다.');
      }

      const totalDurationSec = Math.floor(
        (finishedAt.getTime() - session.startTime.getTime()) / 1000
      );
      const actualDurationSec = totalDurationSec - (session.totalPausedTime || 0);

      session.endTime = finishedAt;
      session.totalTime = actualDurationSec;

      return manager.save(session);
    });
  }

  async findSession(id: number) {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: [
        'workoutSets',
        'workoutSets.exercise',
        'user',
        'routine',
      ],
      order: {
        workoutSets: {
          exercise: { name: 'ASC' },
          setNumber: 'ASC',
        },
      },
    });
    
    if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');
    
    return session;
  }

  async findUserSessions(userId: number, page = 1, limit = 20, month?: string) {
    const query = this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.routine', 'routine')
      .leftJoinAndSelect('session.workoutSets', 'sets')
      .leftJoinAndSelect('sets.exercise', 'exercise')
      .where('session.user.id = :userId', { userId })
      .orderBy('session.date', 'DESC')
      .addOrderBy('session.startTime', 'DESC');

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      
      query.andWhere('session.date BETWEEN :start AND :end', {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      });
    }

    const skip = (page - 1) * limit;
    const [sessions, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTodayStats(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        startTime: Between(today, tomorrow),
      },
      relations: ['workoutSets'],
    });

    const totalVolume = sessions.reduce((sum, session) => sum + session.totalVolume, 0);
    const totalSets = sessions.reduce((sum, session) => sum + (session.workoutSets?.length || 0), 0);
    const totalTime = sessions.reduce((sum, session) => sum + (session.totalTime || 0), 0);

    return {
      date: today.toISOString().split('T')[0],
      sessionCount: sessions.length,
      totalVolume,
      totalSets,
      totalTime,
      avgTimePerSession: sessions.length > 0 ? Math.round(totalTime / sessions.length) : 0,
    };
  }

  async getMonthlyCalendar(userId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const sessions = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        date: Between(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
      },
      relations: ['workoutSets', 'workoutSets.exercise'],
      order: { date: 'ASC' },
    });

    const calendar = sessions.map(session => ({
      date: session.date,
      hasWorkout: true,
      totalVolume: session.totalVolume,
      exerciseCount: new Set(session.workoutSets?.map(set => set.exercise.id)).size,
      setCount: session.workoutSets?.length || 0,
      duration: session.totalTime,
    }));

    const summary = {
      year,
      month,
      totalSessions: sessions.length,
      totalVolume: sessions.reduce((sum, s) => sum + s.totalVolume, 0),
      totalSets: sessions.reduce((sum, s) => sum + (s.workoutSets?.length || 0), 0),
    };

    return {
      calendar,
      summary,
    };
  }

  async addManualWorkout(userId: number, dto: any) {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.save(WorkoutSession, {
        user: { id: userId } as any,
        date: dto.date || new Date().toISOString().split('T')[0],
        startTime: new Date(dto.date + ' ' + dto.startTime),
        endTime: new Date(dto.date + ' ' + dto.endTime),
        totalTime: dto.duration || 0,
        totalVolume: 0,
      });

      let totalVolume = 0;
      for (const exercise of dto.exercises) {
        for (const set of exercise.sets) {
          const volume = calcVolume(set.reps, set.weight);
          totalVolume += volume;
          
          await manager.save(WorkoutSet, {
            workoutSession: session,
            exercise: { id: exercise.exerciseId } as any,
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            volume,
          });

          await this.prSvc.updateRecord(userId, exercise.exerciseId, set.weight, set.reps);
        }
      }

      session.totalVolume = totalVolume;
      return manager.save(session);
    });
  }

  async deleteSet(userId: number, setId: number) {
    return this.dataSource.transaction(async (manager) => {
      const set = await manager.findOne(WorkoutSet, {
        where: { id: setId },
        relations: ['workoutSession', 'workoutSession.user'],
      });

      if (!set) throw new NotFoundException('세트를 찾을 수 없습니다.');
      if (set.workoutSession.user.id !== userId) {
        throw new ForbiddenException('권한이 없습니다.');
      }
      if (set.workoutSession.endTime) {
        throw new BadRequestException('종료된 세션의 세트는 삭제할 수 없습니다.');
      }

      await manager.delete(WorkoutSet, { id: setId });
      
      await manager.decrement(
        WorkoutSession,
        { id: set.workoutSession.id },
        'totalVolume',
        set.volume
      );

      return { success: true, message: '세트가 성공적으로 삭제되었습니다.' };
    });
  }
}