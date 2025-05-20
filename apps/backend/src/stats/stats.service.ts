import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { Exercise } from '../exercises/entities/exercise.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet)
    private readonly setRepo: Repository<WorkoutSet>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
  ) {}

  async getWeeklyStats(userId: number) {
    const since = new Date();
    since.setDate(since.getDate() - 6);

    const data = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoin('s.workoutSets', 'set')
      .leftJoin('set.exercise', 'ex')
      .select('ex.muscleGroup', 'muscle_group')
      .addSelect('SUM(set.volume)', 'volume')
      .where('s.userId = :userId', { userId })
      .andWhere('s.startTime >= :since', { since })
      .groupBy('ex.muscleGroup')
      .getRawMany();

    const total = data.reduce((sum, d) => sum + Number(d.volume), 0);

    return { totalVolume: total, perMuscleGroup: data };
  }

  async getMonthlyStats(userId: number, date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-based

    const data = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoin('s.workoutSets', 'set')
      .leftJoin('set.exercise', 'ex')
      .select('ex.muscleGroup', 'muscle_group')
      .addSelect('SUM(set.volume)', 'volume')
      .where('s.userId = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM s.startTime) = :y', { y: year })
      .andWhere('EXTRACT(MONTH FROM s.startTime) = :m', { m: month })
      .groupBy('ex.muscleGroup')
      .getRawMany();

    const total = data.reduce((sum, d) => sum + Number(d.volume), 0);

    return { year, month, totalVolume: total, perMuscleGroup: data };
  }
}
