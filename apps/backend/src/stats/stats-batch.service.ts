import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DailyStats } from './entities/daily-stats.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { User } from '../users/entities/user.entity';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class StatsBatchService {
  private readonly logger = new Logger(StatsBatchService.name);

  constructor(
    @InjectRepository(DailyStats)
    private dailyStatsRepo: Repository<DailyStats>,
    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async calculateDailyStats() {
    this.logger.log('Starting daily stats calculation...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    try {
      const users = await this.sessionRepo
        .createQueryBuilder('session')
        .select('DISTINCT session.user_id', 'userId')
        .where('session.date = :date', { date: dateStr })
        .andWhere('session.end_time IS NOT NULL')
        .getRawMany();

      this.logger.log(`Found ${users.length} users with workouts on ${dateStr}`);

      for (const { userId } of users) {
        await this.calculateUserDailyStats(userId, dateStr);
      }

      await this.invalidateStatsCache();

      this.logger.log('Daily stats calculation completed');
    } catch (error) {
      this.logger.error('Error calculating daily stats', error);
    }
  }

  private async calculateUserDailyStats(userId: number, dateStr: string) {
    const sessions = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        date: dateStr,
        endTime: Not(IsNull()),
      },
      relations: ['workoutSets', 'workoutSets.exercise'],
    });

    if (sessions.length === 0) return;

    const stats = {
      totalVolume: 0,
      sessionCount: sessions.length,
      setCount: 0,
      totalTime: 0,
      muscleVolume: {} as Record<string, number>,
      exerciseVolume: {} as Record<string, number>,
    };

    for (const session of sessions) {
      stats.totalVolume += session.totalVolume;
      stats.setCount += session.workoutSets.length;
      stats.totalTime += session.totalTime || 0;

      for (const set of session.workoutSets) {
        const muscle = set.exercise.category;
        const exercise = set.exercise.name;

        stats.muscleVolume[muscle] = (stats.muscleVolume[muscle] || 0) + set.volume;
        stats.exerciseVolume[exercise] = (stats.exerciseVolume[exercise] || 0) + set.volume;
      }
    }

    await this.dailyStatsRepo.upsert(
      {
        user: { id: userId } as any,
        date: dateStr,
        ...stats,
      },
      ['user', 'date']
    );
  }

  @Cron('0 3 * * 0')
  async preCalculateWeeklyStats() {
    this.logger.log('Starting weekly stats pre-calculation...');

    const users = await this.userRepo.find({
      select: ['id'],
    });

    for (const user of users) {
      await this.cacheWeeklyStats(user.id);
    }

    this.logger.log('Weekly stats pre-calculation completed');
  }

  private async cacheWeeklyStats(userId: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const dailyStats = await this.dailyStatsRepo.find({
      where: {
        user: { id: userId },
        date: Between(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
      },
    });

    const weeklyStats = {
      totalVolume: 0,
      sessionCount: 0,
      setCount: 0,
      totalTime: 0,
      muscleVolume: {} as Record<string, number>,
      exerciseVolume: {} as Record<string, number>,
      dailyBreakdown: [] as any[],
    };

    for (const day of dailyStats) {
      weeklyStats.totalVolume += day.totalVolume;
      weeklyStats.sessionCount += day.sessionCount;
      weeklyStats.setCount += day.setCount;
      weeklyStats.totalTime += day.totalTime;

      if (day.muscleVolume) {
        for (const [muscle, volume] of Object.entries(day.muscleVolume)) {
          weeklyStats.muscleVolume[muscle] = (weeklyStats.muscleVolume[muscle] || 0) + volume;
        }
      }

      weeklyStats.dailyBreakdown.push({
        date: day.date,
        volume: day.totalVolume,
        sessions: day.sessionCount,
      });
    }

    const cacheKey = `weekly-stats:${userId}:${endDate.toISOString().split('T')[0]}`;
    await this.cacheManager.set(cacheKey, weeklyStats, 86400000);
  }

  @Cron('0 4 1 * *')
  async preCalculateMonthlyStats() {
    this.logger.log('Starting monthly stats pre-calculation...');

    const users = await this.userRepo.find({
      select: ['id'],
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    for (const user of users) {
      await this.cacheMonthlyStats(user.id, year, month);
    }

    this.logger.log('Monthly stats pre-calculation completed');
  }

  private async cacheMonthlyStats(userId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const dailyStats = await this.dailyStatsRepo.find({
      where: {
        user: { id: userId },
        date: Between(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
      },
    });

    const monthlyStats = {
      totalVolume: 0,
      sessionCount: 0,
      setCount: 0,
      totalTime: 0,
      muscleVolume: {} as Record<string, number>,
      weeklyBreakdown: [] as any[],
    };

    for (const day of dailyStats) {
      monthlyStats.totalVolume += day.totalVolume;
      monthlyStats.sessionCount += day.sessionCount;
      monthlyStats.setCount += day.setCount;
      monthlyStats.totalTime += day.totalTime;

      if (day.muscleVolume) {
        for (const [muscle, volume] of Object.entries(day.muscleVolume)) {
          monthlyStats.muscleVolume[muscle] = (monthlyStats.muscleVolume[muscle] || 0) + volume;
        }
      }
    }

    const weeks = this.groupByWeek(dailyStats);
    monthlyStats.weeklyBreakdown = weeks.map(week => ({
      weekNumber: week.weekNumber,
      totalVolume: week.stats.reduce((sum, day) => sum + day.totalVolume, 0),
      sessionCount: week.stats.reduce((sum, day) => sum + day.sessionCount, 0),
    }));

    const cacheKey = `monthly-stats:${userId}:${year}-${month}`;
    await this.cacheManager.set(cacheKey, monthlyStats, 604800000);
  }

  private groupByWeek(dailyStats: DailyStats[]) {
    const weeks = new Map<number, DailyStats[]>();

    for (const stat of dailyStats) {
      const date = new Date(stat.date);
      const weekNumber = this.getWeekNumber(date);
      
      if (!weeks.has(weekNumber)) {
        weeks.set(weekNumber, []);
      }
      weeks.get(weekNumber)!.push(stat);
    }

    return Array.from(weeks.entries()).map(([weekNumber, stats]) => ({
      weekNumber,
      stats,
    }));
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private async invalidateStatsCache() {
    try {
      const cacheKeys = [
        'weekly-stats:*',
        'monthly-stats:*',
        'exercise-progress:*',
        'workout-frequency:*',
        'muscle-heatmap:*',
        'dashboard-stats:*',
      ];

      for (const pattern of cacheKeys) {
        await this.deleteCacheByPattern(pattern);
      }
    } catch (error) {
      this.logger.error('Error invalidating cache', error);
    }
  }

  async updateRealtimeStats(userId: number, sessionId: number) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['workoutSets', 'workoutSets.exercise'],
    });

    if (!session || !session.endTime) return;

    const dateStr = session.date;
    
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) {
      await this.calculateUserDailyStats(userId, dateStr);
    }

    await this.invalidateUserStatsCache(userId);
  }

  private async invalidateUserStatsCache(userId: number) {
    const patterns = [
      `weekly-stats:${userId}:*`,
      `monthly-stats:${userId}:*`,
      `exercise-progress:${userId}:*`,
      `workout-frequency:${userId}`,
      `muscle-heatmap:${userId}`,
      `dashboard-stats:${userId}`,
    ];

    for (const pattern of patterns) {
      try {
        await this.deleteCacheByPattern(pattern);
      } catch (error) {
        this.logger.error(`Error invalidating cache for pattern ${pattern}`, error);
      }
    }
  }

  private async deleteCacheByPattern(pattern: string) {
    try {
      const cacheStore = this.cacheManager as any;
      
      if (cacheStore.store && typeof cacheStore.store.keys === 'function') {
        const keys = await cacheStore.store.keys(pattern);
        for (const key of keys) {
          await this.cacheManager.del(key);
        }
      } else if (cacheStore.keys && typeof cacheStore.keys === 'function') {
        const keys = await cacheStore.keys(pattern);
        for (const key of keys) {
          await this.cacheManager.del(key);
        }
      } else {
        this.logger.warn('Cache store does not support pattern-based key retrieval');
      }
    } catch (error) {
      this.logger.error(`Error deleting cache keys for pattern: ${pattern}`, error);
    }
  }
}