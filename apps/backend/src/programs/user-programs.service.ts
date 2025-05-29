import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { UserProgram } from './entities/user-program.entity';
import { Routine } from '../routines/entities/routine.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';

@Injectable()
export class UserProgramsService {
  constructor(
    @InjectRepository(UserProgram)
    private programRepo: Repository<UserProgram>,
    @InjectRepository(Routine)
    private routineRepo: Repository<Routine>,
    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,
  ) {}

  async startProgram(userId: number, routineId: number) {
    const activeProgram = await this.programRepo.findOne({
      where: { user: { id: userId }, isActive: true },
    });

    if (activeProgram) {
      throw new ConflictException('이미 진행 중인 프로그램이 있습니다.');
    }

    const routine = await this.routineRepo.findOne({
      where: { id: routineId },
      relations: ['creator'],
    });

    if (!routine) {
      throw new NotFoundException('루틴을 찾을 수 없습니다.');
    }

    if (!routine.isPublic && routine.creator?.id !== userId) {
      throw new BadRequestException('이 루틴에 접근할 권한이 없습니다.');
    }

    const program = this.programRepo.create({
      user: { id: userId } as any,
      routine,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      progress: {
        week: 1,
        day: 1,
      },
    });

    return this.programRepo.save(program);
  }

  async getActiveProgram(userId: number) {
    const program = await this.programRepo.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: ['routine', 'routine.routineExercises', 'routine.routineExercises.exercise'],
    });

    if (!program) {
      return null;
    }

    const whereCondition: any = {
      user: { id: userId },
      routine: { id: program.routine.id },
    };

    if (program.startDate) {
      whereCondition.date = MoreThanOrEqual(program.startDate);
    }

    const totalSessions = await this.sessionRepo.count({
      where: whereCondition,
    });

    return {
      ...program,
      completedSessions: totalSessions,
      progressPercentage: Math.round((totalSessions / 30) * 100),
    };
  }

  async updateProgress(userId: number, sessionId: number) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['routine'],
    });

    if (!session || !session.routine) {
      return;
    }

    const program = await this.programRepo.findOne({
      where: {
        user: { id: userId },
        routine: { id: session.routine.id },
        isActive: true,
      },
    });

    if (!program) {
      return;
    }

    program.completedSessions += 1;
    program.progress = {
      week: program.progress?.week || 1,
      day: program.progress?.day || 1,
      lastSessionId: sessionId,
    };

    if (program.completedSessions >= 30) {
      program.isActive = false;
      program.endDate = new Date().toISOString().split('T')[0];
    }

    await this.programRepo.save(program);
  }

  async pauseProgram(userId: number) {
    const program = await this.programRepo.findOne({
      where: { user: { id: userId }, isActive: true },
    });

    if (!program) {
      throw new NotFoundException('진행 중인 프로그램이 없습니다.');
    }

    program.isActive = false;
    return this.programRepo.save(program);
  }

  async resumeProgram(userId: number, programId: number) {
    await this.programRepo.update(
      { user: { id: userId }, isActive: true },
      { isActive: false }
    );

    const program = await this.programRepo.findOne({
      where: { id: programId, user: { id: userId } },
    });

    if (!program) {
      throw new NotFoundException('프로그램을 찾을 수 없습니다.');
    }

    program.isActive = true;
    return this.programRepo.save(program);
  }

  async getProgramHistory(userId: number) {
    return this.programRepo.find({
      where: { user: { id: userId } },
      relations: ['routine'],
      order: { createdAt: 'DESC' },
    });
  }
}