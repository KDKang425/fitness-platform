import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';

export interface StatsResponse {
  totalVolume: number;
  perMuscleGroup: { muscle_group: string; volume: string }[];
  prevTotalVolume: number;
  diffPercent: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet)
    private readonly setRepo: Repository<WorkoutSet>,
  ) {}

  async getWeeklyStats(userId: number, base = new Date()): Promise<StatsResponse> {
    const curFrom = this.startOfDay(this.addDays(base, -6));
    const curTo = this.endOfDay(base);

    const prevTo = this.addDays(curFrom, -1);
    const prevFrom = this.startOfDay(this.addDays(prevTo, -6));

    return this.computeStats(userId, curFrom, curTo, prevFrom, prevTo);
  }

  async getMonthlyStats(userId: number, base = new Date()): Promise<StatsResponse> {
    const curFrom = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0);
    const curTo = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59);

    const prevTo = this.addDays(curFrom, -1);
    const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth(), 1, 0, 0, 0);

    return this.computeStats(userId, curFrom, curTo, prevFrom, prevTo);
  }

  private async computeStats(
    userId: number,
    curFrom: Date,
    curTo: Date,
    prevFrom: Date,
    prevTo: Date,
  ): Promise<StatsResponse> {
    const curData = await this.queryMuscleVolume(userId, curFrom, curTo);
    const curTotal = curData.reduce((s, d) => s + Number(d.volume), 0);

    const prevData = await this.queryMuscleVolume(userId, prevFrom, prevTo);
    const prevTotal = prevData.reduce((s, d) => s + Number(d.volume), 0);

    const diff =
      prevTotal === 0 ? 100 : ((curTotal - prevTotal) / prevTotal) * 100;

    return {
      totalVolume: curTotal,
      perMuscleGroup: curData,
      prevTotalVolume: prevTotal,
      diffPercent: Math.round(diff * 10) / 10, 
    };
  }

  private queryMuscleVolume(userId: number, from: Date, to: Date) {
    return this.sessionRepo
      .createQueryBuilder('s')
      .leftJoin('s.workoutSets', 'set')
      .leftJoin('set.exercise', 'ex')
      .select('ex.category', 'muscle_group')         
      .addSelect('SUM(set.volume)', 'volume')
      .where('s.userId = :uid', { uid: userId })
      .andWhere('s.startTime BETWEEN :from AND :to', { from, to })
      .groupBy('ex.category')
      .getRawMany();
  }

  private startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  }
  private endOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  }
  private addDays(d: Date, n: number) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }
}
