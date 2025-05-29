import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { MuscleGroup } from '../exercises/entities/muscle-group.enum';

export interface MuscleRecoveryStatus {
  muscle: MuscleGroup;
  lastWorked: Date | null;
  recoveryHours: number;
  isRecovered: boolean;
  nextRecommended: Date;
  intensity: 'light' | 'moderate' | 'heavy';
}

@Injectable()
export class RecoveryService {
  private readonly recoveryTimes: Record<MuscleGroup, number> = {
    [MuscleGroup.CHEST]: 72,
    [MuscleGroup.BACK]: 72,
    [MuscleGroup.SHOULDER]: 48,
    [MuscleGroup.TRICEPS]: 48,
    [MuscleGroup.BICEPS]: 48,
    [MuscleGroup.FOREARM]: 24,
    [MuscleGroup.ABS]: 24,
    [MuscleGroup.GLUTES]: 72,
    [MuscleGroup.HAMSTRING]: 72,
    [MuscleGroup.QUADRICEPS]: 72,
    [MuscleGroup.TRAPS]: 48,
    [MuscleGroup.CALVES]: 48,
  };

  constructor(
    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet)
    private setRepo: Repository<WorkoutSet>,
  ) {}

  async getMuscleRecoveryStatus(userId: number): Promise<MuscleRecoveryStatus[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSets = await this.setRepo
      .createQueryBuilder('set')
      .leftJoin('set.workoutSession', 'session')
      .leftJoin('set.exercise', 'exercise')
      .where('session.user.id = :userId', { userId })
      .andWhere('session.startTime >= :date', { date: sevenDaysAgo })
      .select([
        'exercise.category',
        'session.startTime',
        'SUM(set.volume) as totalVolume',
        'COUNT(set.id) as setCount',
      ])
      .groupBy('exercise.category')
      .addGroupBy('session.startTime')
      .orderBy('session.startTime', 'DESC')
      .getRawMany();

    const muscleData = new Map<MuscleGroup, { lastWorked: Date; totalVolume: number }>();

    for (const record of recentSets) {
      const muscle = record.exercise_category;
      const existing = muscleData.get(muscle);
      
      if (!existing || record.session_start_time > existing.lastWorked) {
        muscleData.set(muscle, {
          lastWorked: record.session_start_time,
          totalVolume: Number(record.totalVolume),
        });
      }
    }

    const recoveryStatus: MuscleRecoveryStatus[] = [];

    for (const muscle of Object.values(MuscleGroup)) {
      const data = muscleData.get(muscle);
      const recoveryTime = this.recoveryTimes[muscle];
      
      if (!data) {
        recoveryStatus.push({
          muscle,
          lastWorked: null,
          recoveryHours: recoveryTime,
          isRecovered: true,
          nextRecommended: new Date(),
          intensity: 'light',
        });
        continue;
      }

      const hoursSinceWorkout = (Date.now() - data.lastWorked.getTime()) / (1000 * 60 * 60);
      const isRecovered = hoursSinceWorkout >= recoveryTime;
      const nextRecommended = new Date(data.lastWorked.getTime() + recoveryTime * 60 * 60 * 1000);

      const intensity = this.calculateIntensity(data.totalVolume, muscle);

      recoveryStatus.push({
        muscle,
        lastWorked: data.lastWorked,
        recoveryHours: Math.round(hoursSinceWorkout),
        isRecovered,
        nextRecommended,
        intensity,
      });
    }

    return recoveryStatus;
  }

  private calculateIntensity(volume: number, muscle: MuscleGroup): 'light' | 'moderate' | 'heavy' {
    const thresholds = {
      [MuscleGroup.CHEST]: { light: 2000, heavy: 5000 },
      [MuscleGroup.BACK]: { light: 2500, heavy: 6000 },
      [MuscleGroup.SHOULDER]: { light: 1500, heavy: 3500 },
      [MuscleGroup.TRICEPS]: { light: 1000, heavy: 2500 },
      [MuscleGroup.BICEPS]: { light: 1000, heavy: 2500 },
      [MuscleGroup.FOREARM]: { light: 500, heavy: 1500 },
      [MuscleGroup.ABS]: { light: 1000, heavy: 3000 },
      [MuscleGroup.GLUTES]: { light: 2000, heavy: 5000 },
      [MuscleGroup.HAMSTRING]: { light: 1500, heavy: 4000 },
      [MuscleGroup.QUADRICEPS]: { light: 2500, heavy: 6000 },
      [MuscleGroup.TRAPS]: { light: 1000, heavy: 2500 },
      [MuscleGroup.CALVES]: { light: 1000, heavy: 2500 },
    };

    const threshold = thresholds[muscle];
    if (volume < threshold.light) return 'light';
    if (volume > threshold.heavy) return 'heavy';
    return 'moderate';
  }

  async getOptimalWorkoutSplit(userId: number) {
    const recoveryStatus = await this.getMuscleRecoveryStatus(userId);
    const workoutHistory = await this.getWorkoutPattern(userId);

    const splits = {
      ppl: this.calculatePPLSplit(recoveryStatus, workoutHistory),
      upperLower: this.calculateUpperLowerSplit(recoveryStatus, workoutHistory),
      fullBody: this.calculateFullBodySplit(recoveryStatus, workoutHistory),
      bro: this.calculateBroSplit(recoveryStatus, workoutHistory),
    };

    const recommendation = this.recommendBestSplit(splits, workoutHistory);

    return {
      currentPattern: workoutHistory,
      recoveryStatus,
      splits,
      recommendation,
    };
  }

  private async getWorkoutPattern(userId: number) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.sessionRepo.count({
      where: {
        user: { id: userId },
        startTime: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    const avgPerWeek = (sessions / 4.3);

    return {
      sessionsLast30Days: sessions,
      avgSessionsPerWeek: Math.round(avgPerWeek * 10) / 10,
      frequency: avgPerWeek <= 3 ? 'low' : avgPerWeek <= 5 ? 'moderate' : 'high',
    };
  }

  private calculatePPLSplit(recovery: MuscleRecoveryStatus[], pattern: any) {
    return {
      name: 'Push/Pull/Legs',
      schedule: [
        { day: 'Monday', muscles: ['CHEST', 'SHOULDER', 'TRICEPS'] },
        { day: 'Tuesday', muscles: ['BACK', 'BICEPS'] },
        { day: 'Wednesday', muscles: ['QUADRICEPS', 'HAMSTRING', 'GLUTES', 'CALVES'] },
        { day: 'Thursday', rest: true },
        { day: 'Friday', muscles: ['CHEST', 'SHOULDER', 'TRICEPS'] },
        { day: 'Saturday', muscles: ['BACK', 'BICEPS'] },
        { day: 'Sunday', muscles: ['QUADRICEPS', 'HAMSTRING', 'GLUTES', 'CALVES'] },
      ],
      suitability: pattern.frequency === 'high' ? 0.9 : 0.7,
    };
  }

  private calculateUpperLowerSplit(recovery: MuscleRecoveryStatus[], pattern: any) {
    return {
      name: 'Upper/Lower',
      schedule: [
        { day: 'Monday', muscles: ['CHEST', 'BACK', 'SHOULDER', 'BICEPS', 'TRICEPS'] },
        { day: 'Tuesday', muscles: ['QUADRICEPS', 'HAMSTRING', 'GLUTES', 'CALVES'] },
        { day: 'Wednesday', rest: true },
        { day: 'Thursday', muscles: ['CHEST', 'BACK', 'SHOULDER', 'BICEPS', 'TRICEPS'] },
        { day: 'Friday', muscles: ['QUADRICEPS', 'HAMSTRING', 'GLUTES', 'CALVES'] },
        { day: 'Saturday', rest: true },
        { day: 'Sunday', rest: true },
      ],
      suitability: pattern.frequency === 'moderate' ? 0.9 : 0.7,
    };
  }

  private calculateFullBodySplit(recovery: MuscleRecoveryStatus[], pattern: any) {
    return {
      name: 'Full Body',
      schedule: [
        { day: 'Monday', muscles: ['CHEST', 'BACK', 'QUADRICEPS'] },
        { day: 'Wednesday', muscles: ['SHOULDER', 'HAMSTRING', 'BICEPS'] },
        { day: 'Friday', muscles: ['CHEST', 'BACK', 'GLUTES', 'TRICEPS'] },
      ],
      suitability: pattern.frequency === 'low' ? 0.9 : 0.6,
    };
  }

  private calculateBroSplit(recovery: MuscleRecoveryStatus[], pattern: any) {
    return {
      name: 'Bro Split',
      schedule: [
        { day: 'Monday', muscles: ['CHEST'] },
        { day: 'Tuesday', muscles: ['BACK'] },
        { day: 'Wednesday', muscles: ['SHOULDER'] },
        { day: 'Thursday', muscles: ['BICEPS', 'TRICEPS'] },
        { day: 'Friday', muscles: ['QUADRICEPS', 'HAMSTRING', 'GLUTES', 'CALVES'] },
        { day: 'Saturday', rest: true },
        { day: 'Sunday', rest: true },
      ],
      suitability: pattern.frequency === 'moderate' ? 0.8 : 0.6,
    };
  }

  private recommendBestSplit(splits: any, pattern: any) {
    let best = { split: '', score: 0 };

    for (const [name, split] of Object.entries(splits)) {
      if ((split as any).suitability > best.score) {
        best = { split: name, score: (split as any).suitability };
      }
    }

    return {
      recommended: best.split,
      reason: this.getSplitRecommendationReason(best.split, pattern),
    };
  }

  private getSplitRecommendationReason(split: string, pattern: any): string {
    const reasons = {
      ppl: `주 ${pattern.avgSessionsPerWeek}회 운동 패턴에 적합한 고빈도 분할입니다.`,
      upperLower: `균형잡힌 회복 시간과 적절한 운동 빈도를 제공합니다.`,
      fullBody: `주 3회 이하 운동에 최적화된 전신 운동입니다.`,
      bro: `각 근육군에 충분한 회복 시간을 제공하는 전통적인 분할입니다.`,
    };

    return reasons[split] || '개인 운동 패턴에 맞춰 추천되었습니다.';
  }
}