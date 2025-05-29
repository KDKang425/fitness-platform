import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, MoreThanOrEqual, IsNull } from 'typeorm';

import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutSet } from './entities/workout-set.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import { User } from '../users/entities/user.entity';
import { Routine } from '../routines/entities/routine.entity';

import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
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
    const user = await this.userRepo.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('User not found');

    const activeSession = await this.sessionRepo.findOne({
      where: {
        user: { id: dto.userId },
        endTime: IsNull(),
      },
    });

    if (activeSession) {
      throw new BadRequestException('이미 진행 중인 운동 세션이 있습니다.');
    }

    if (dto.routineId) {
      const routine = await this.routineRepo.findOne({
        where: { id: dto.routineId },
        relations: ['creator'],
      });

      if (!routine) {
        throw new NotFoundException('Routine not found');
      }

      if (!routine.isPublic && routine.creator?.id !== dto.userId) {
        throw new BadRequestException('이 루틴에 접근할 권한이 없습니다.');
      }
    }

    const session = this.sessionRepo.create({
      user,
      routine: dto.routineId ? ({ id: dto.routineId } as any) : null,
      startTime: dto.startTime ?? new Date(),
      totalVolume: 0,
    });
    
    return this.sessionRepo.save(session);
  }

  async addSet(dto: CreateWorkoutSetDto) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['workoutSets', 'workoutSets.exercise', 'user'],
    });
    
    if (!session) throw new NotFoundException('Session not found');
    if (session.endTime) {
      throw new BadRequestException('세션이 이미 종료되었습니다.');
    }

    const exercise = await this.exerciseRepo.findOneBy({ id: dto.exerciseId });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const lastSetOfExercise = session.workoutSets
      ?.filter(set => set.exercise.id === dto.exerciseId)
      .sort((a, b) => b.setNumber - a.setNumber)[0];

    const setNumber = dto.setNumber ?? (lastSetOfExercise ? lastSetOfExercise.setNumber + 1 : 1);
    const volume = calcVolume(dto.reps, dto.weight);

    const savedSet = await this.dataSource.transaction(async (manager) => {
      const set = manager.create(WorkoutSet, {
        workoutSession: session,
        exercise,
        setNumber,
        reps: dto.reps,
        weight: dto.weight,
        volume,
      });
      await manager.save(set);

      session.totalVolume += volume;
      await manager.save(session);

      return set;
    });

    await this.prSvc.updateRecord(
      session.user.id,
      exercise.id,
      dto.weight,
      dto.reps,
    );

    return savedSet;
  }

  async finishSession(id: number, endTime?: string) {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['workoutSets'],
    });
    
    if (!session) throw new NotFoundException('Session not found');
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

    const durationSec = Math.floor(
      (finishedAt.getTime() - session.startTime.getTime()) / 1000
    );

    session.endTime = finishedAt;
    session.totalTime = durationSec;

    return this.sessionRepo.save(session);
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
    
    if (!session) throw new NotFoundException('Session not found');
    
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
}