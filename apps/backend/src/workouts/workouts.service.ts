import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutSet } from './entities/workout-set.entity';
import { Exercise } from '../exercises/entities/exercise.entity';

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
    private readonly dataSource: DataSource,
    private readonly prSvc: PersonalRecordsService,
  ) {}

  async startSession(dto: CreateWorkoutSessionDto) {
    const session = this.sessionRepo.create({
      user: { id: dto.userId } as any,
      routine: dto.routineId ? ({ id: dto.routineId } as any) : null,
      startTime: dto.startTime ?? new Date(),
      totalVolume: 0,
    });
    return this.sessionRepo.save(session);
  }

  async addSet(dto: CreateWorkoutSetDto) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['workoutSets', 'user'],      
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.endTime)
      throw new BadRequestException('Session already finished');

    const exercise = await this.exerciseRepo.findOneBy({ id: dto.exerciseId });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const setNumber =
      dto.setNumber ??
      (session.workoutSets ? session.workoutSets.length + 1 : 1);

    const volume = calcVolume(dto.reps, dto.weight);

    const savedSet = await this.dataSource.transaction(async (manager) => {
      const set = this.setRepo.create({
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
    const session = await this.sessionRepo.findOneBy({ id });
    if (!session) throw new NotFoundException('Session not found');
    if (session.endTime)
      throw new BadRequestException('Session already finished');
    if (!session.startTime)
      throw new BadRequestException('Session has no start time');

    const finishedAt = endTime ? new Date(endTime) : new Date();
    const durationSec =
      (finishedAt.getTime() - session.startTime.getTime()) / 1000;

    session.endTime = finishedAt;
    session.totalTime = Math.floor(durationSec);

    return this.sessionRepo.save(session);
  }

  findSession(id: number) {
    return this.sessionRepo.findOne({
      where: { id },
      relations: ['workoutSets', 'workoutSets.exercise'],
    });
  }

  findAllSessions() {
    return this.sessionRepo.find({
      relations: ['workoutSets', 'workoutSets.exercise'],
    });
  }
}
