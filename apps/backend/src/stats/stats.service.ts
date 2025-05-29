import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';
import { MuscleGroup } from '../exercises/entities/muscle-group.enum';
import { Exercise } from '../exercises/entities/exercise.entity';
import { User } from '../users/entities/user.entity';

export interface StatsResponse {
  totalVolume: number;
  perMuscleGroup: { muscle_group: string; volume: number; percentage: number }[];
  prevTotalVolume: number;
  diffPercent: number;
  sessionCount: number;
  avgVolumePerSession: number;
}

export interface MuscleHeatmapData {
  muscle: string;
  data: { date: string; volume: number }[];
}

const MUSCLE_VISUALIZATION_MAP = {
  CHEST: { x: 50, y: 30, size: 'large', front: true },
  BACK: { x: 50, y: 35, size: 'large', front: false },
  SHOULDER: { x: 35, y: 25, size: 'medium', front: true },
  TRICEPS: { x: 30, y: 40, size: 'small', front: false },
  BICEPS: { x: 30, y: 40, size: 'small', front: true },
  FOREARM: { x: 25, y: 50, size: 'small', front: true },
  ABS: { x: 50, y: 45, size: 'medium', front: true },
  GLUTES: { x: 50, y: 55, size: 'medium', front: false },
  HAMSTRING: { x: 45, y: 65, size: 'medium', front: false },
  QUADRICEPS: { x: 45, y: 60, size: 'large', front: true },
  TRAPS: { x: 50, y: 20, size: 'medium', front: false },
  CALVES: { x: 45, y: 80, size: 'small', front: false },
};

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet)
    private readonly setRepo: Repository<WorkoutSet>,
    @InjectRepository(PersonalRecord)
    private readonly prRepo: Repository<PersonalRecord>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
    const [curData, curSessions] = await Promise.all([
      this.queryMuscleVolume(userId, curFrom, curTo),
      this.sessionRepo.count({
        where: {
          user: { id: userId },
          startTime: Between(curFrom, curTo),
        },
      }),
    ]);

    const curTotal = curData.reduce((s, d) => s + d.volume, 0);

    const prevData = await this.queryMuscleVolume(userId, prevFrom, prevTo);
    const prevTotal = prevData.reduce((s, d) => s + d.volume, 0);

    const diff = prevTotal === 0 ? 100 : ((curTotal - prevTotal) / prevTotal) * 100;

    const perMuscleGroup = curData.map(item => ({
      muscle_group: item.muscle_group,
      volume: item.volume,
      percentage: curTotal > 0 ? Math.round((item.volume / curTotal) * 100) : 0,
    }));

    return {
      totalVolume: curTotal,
      perMuscleGroup,
      prevTotalVolume: prevTotal,
      diffPercent: Math.round(diff * 10) / 10,
      sessionCount: curSessions,
      avgVolumePerSession: curSessions > 0 ? Math.round(curTotal / curSessions) : 0,
    };
  }

  private async queryMuscleVolume(userId: number, from: Date, to: Date) {
    const result = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoin('s.workoutSets', 'set')
      .leftJoin('set.exercise', 'ex')
      .select('ex.category', 'muscle_group')
      .addSelect('SUM(set.volume)', 'volume')
      .where('s.user.id = :uid', { uid: userId })
      .andWhere('s.startTime BETWEEN :from AND :to', { from, to })
      .groupBy('ex.category')
      .getRawMany();

    return result.map(r => ({
      muscle_group: r.muscle_group,
      volume: Number(r.volume) || 0,
    }));
  }

  async getExerciseProgress(userId: number, period: 'week' | 'month' | 'year') {
    const now = new Date();
    let from: Date;

    switch (period) {
      case 'week':
        from = this.addDays(now, -7);
        break;
      case 'month':
        from = this.addDays(now, -30);
        break;
      case 'year':
        from = this.addDays(now, -365);
        break;
    }

    const progress = await this.setRepo
      .createQueryBuilder('set')
      .leftJoin('set.workoutSession', 'session')
      .leftJoin('set.exercise', 'exercise')
      .select('exercise.id', 'exerciseId')
      .addSelect('exercise.name', 'exerciseName')
      .addSelect('MAX(set.weight)', 'maxWeight')
      .addSelect('MAX(set.volume)', 'maxVolume')
      .addSelect('AVG(set.weight)', 'avgWeight')
      .addSelect('COUNT(DISTINCT session.id)', 'sessionCount')
      .where('session.user.id = :userId', { userId })
      .andWhere('session.startTime >= :from', { from })
      .groupBy('exercise.id')
      .addGroupBy('exercise.name')
      .orderBy('COUNT(DISTINCT session.id)', 'DESC')
      .limit(10)
      .getRawMany();

    return progress.map(p => ({
      exerciseId: p.exerciseId,
      exerciseName: p.exerciseName,
      maxWeight: Number(p.maxWeight),
      maxVolume: Number(p.maxVolume),
      avgWeight: Math.round(Number(p.avgWeight) * 10) / 10,
      sessionCount: Number(p.sessionCount),
    }));
  }

  async getWorkoutFrequency(userId: number) {
    const thirtyDaysAgo = this.addDays(new Date(), -30);

    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.user.id = :userId', { userId })
      .andWhere('session.startTime >= :from', { from: thirtyDaysAgo })
      .select(['session.startTime'])
      .getMany();

    const byDayOfWeek = Array(7).fill(0);
    const byHourOfDay = Array(24).fill(0);

    sessions.forEach(session => {
      if (session.startTime) {
        const date = new Date(session.startTime);
        byDayOfWeek[date.getDay()]++;
        byHourOfDay[date.getHours()]++;
      }
    });

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    return {
      byDayOfWeek: dayNames.map((name, index) => ({
        day: name,
        count: byDayOfWeek[index],
      })),
      byHourOfDay: byHourOfDay.map((count, hour) => ({
        hour,
        count,
      })),
      totalSessions: sessions.length,
      avgPerWeek: Math.round((sessions.length / 4.3) * 10) / 10,
    };
  }

  async getMuscleHeatmap(userId: number): Promise<MuscleHeatmapData[]> {
    const thirtyDaysAgo = this.addDays(new Date(), -30);

    const data = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoin('s.workoutSets', 'set')
      .leftJoin('set.exercise', 'ex')
      .select('DATE(s.startTime)', 'date')
      .addSelect('ex.category', 'muscle')
      .addSelect('SUM(set.volume)', 'volume')
      .where('s.user.id = :uid', { uid: userId })
      .andWhere('s.startTime >= :from', { from: thirtyDaysAgo })
      .groupBy('DATE(s.startTime)')
      .addGroupBy('ex.category')
      .getRawMany();

    const groupedData = data.reduce((acc, d) => {
      if (!acc[d.muscle]) acc[d.muscle] = [];
      acc[d.muscle].push({
        date: d.date,
        volume: Number(d.volume) || 0,
      });
      return acc;
    }, {} as Record<string, { date: string; volume: number }[]>);

    return Object.entries(groupedData).map(([muscle, data]) => ({
      muscle,
      data: data as { date: string; volume: number }[],
    }));
  }

  async getDashboardStats(userId: number) {
    const [prs, recentSessions, monthlyVolume] = await Promise.all([
      this.prRepo.find({
        where: { user: { id: userId } },
        relations: ['exercise'],
        order: { estimated1RM: 'DESC' },
        take: 5,
      }),

      this.sessionRepo
        .createQueryBuilder('session')
        .where('session.user.id = :userId', { userId })
        .orderBy('session.startTime', 'DESC')
        .select(['session.id', 'session.date', 'session.totalVolume', 'session.totalTime', 'session.startTime'])
        .limit(5)
        .getMany(),

      this.getMonthlyStats(userId),
    ]);

    return {
      topPRs: prs.map(pr => ({
        exerciseName: pr.exercise.name,
        bestWeight: pr.bestWeight,
        bestReps: pr.bestReps,
        estimated1RM: pr.estimated1RM,
        lastUpdated: pr.updatedAt,
      })),
      recentSessions: recentSessions.map(s => ({
        id: s.id,
        date: s.date,
        totalVolume: s.totalVolume,
        duration: s.totalTime,
      })),
      monthlyStats: {
        totalVolume: monthlyVolume.totalVolume,
        sessionCount: monthlyVolume.sessionCount,
        diffPercent: monthlyVolume.diffPercent,
      },
    };
  }

  async getMainLifts1RM(userId: number) {
    const mainLifts = {
      benchPress: 'Barbell Bench Press',
      squat: 'Barbell Squat',
      deadlift: 'Deadlift',
      overheadPress: 'Overhead Press',
    };

    const result: any = {};

    for (const [key, exerciseName] of Object.entries(mainLifts)) {
      const exercise = await this.exerciseRepo.findOne({
        where: { name: exerciseName },
    });

      if (!exercise) {
        result[key] = null;
        continue;
      }

      const pr = await this.prRepo.findOne({
        where: { 
          user: { id: userId },
          exercise: { id: exercise.id },
        },
      });

      if (pr) {
        result[key] = {
          weight: pr.bestWeight,
          reps: pr.bestReps,
          estimated1RM: pr.estimated1RM,
          lastUpdated: pr.updatedAt,
        };
      } else {
        const user = await this.userRepo.findOne({
          where: { id: userId },
          select: ['benchPress1RM', 'squat1RM', 'deadlift1RM', 'overheadPress1RM'],
        });

        if (user) {
          const profileValue = user[`${key}1RM`];
          if (profileValue) {
            result[key] = {
              weight: profileValue,
              reps: 1,
              estimated1RM: profileValue,
              lastUpdated: null,
              isFromProfile: true,
            };
          } else {
            result[key] = null;
          }
        }
      }
    }

    return result;
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