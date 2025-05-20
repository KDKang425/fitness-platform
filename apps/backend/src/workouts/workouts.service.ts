import {
  Injectable,
  NotFoundException,
  BadRequestException, 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutSet } from './entities/workout-set.entity';
import { Exercise } from '../exercises/entities/exercise.entity';

import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { CreateWorkoutSetDto } from './dto/create-workout-set.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet)
    private readonly setRepo: Repository<WorkoutSet>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
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

  private calcVolume(reps: number, weight: number) {
    return reps * weight;
  }

  async addSet(dto: CreateWorkoutSetDto) {
    const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const exercise = await this.exerciseRepo.findOne({ where: { id: dto.exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const volume = this.calcVolume(dto.reps, dto.weight);
    const set = this.setRepo.create({
      workoutSession: session,
      exercise,
      setNumber: dto.setNumber,
      reps: dto.reps,
      weight: dto.weight,
      volume,
    });
    await this.setRepo.save(set);

    await this.sessionRepo.update(session.id, {
      totalVolume: () => `"total_volume" + ${volume}`,
    });

    return set;
  }

async finishSession(id: number, endTime?: string) {
  const session = await this.sessionRepo.findOne({
    where: { id },
    relations: ['workoutSets'],
  });
  if (!session) throw new NotFoundException('Session not found');

  if (!session.startTime) {
    throw new BadRequestException('Session has no start time');
  }

  const finishedAt = endTime ? new Date(endTime) : new Date();
  const durationSec = Math.floor(
    (finishedAt.getTime() - session.startTime.getTime()) / 1000,
  );

  session.endTime = finishedAt;
  session.totalTime = durationSec;

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
