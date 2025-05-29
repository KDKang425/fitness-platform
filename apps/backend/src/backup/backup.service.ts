import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { BodyRecord } from '../body-records/entities/body-record.entity';
import { Routine } from '../routines/entities/routine.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';

@Injectable()
export class BackupService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(WorkoutSession) private sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet) private setRepo: Repository<WorkoutSet>,
    @InjectRepository(BodyRecord) private bodyRecordRepo: Repository<BodyRecord>,
    @InjectRepository(Routine) private routineRepo: Repository<Routine>,
    @InjectRepository(PersonalRecord) private prRepo: Repository<PersonalRecord>,
  ) {}

  async createFullBackup(userId: number) {
    const [user, sessions, bodyRecords, routines, personalRecords] = await Promise.all([
      this.userRepo.findOne({
        where: { id: userId },
        select: ['id', 'email', 'nickname', 'height', 'initialWeight', 
                'benchPress1RM', 'squat1RM', 'deadlift1RM', 'overheadPress1RM'],
      }),
      this.sessionRepo.find({
        where: { user: { id: userId } },
        relations: ['workoutSets', 'workoutSets.exercise', 'routine'],
        order: { date: 'DESC' },
      }),
      this.bodyRecordRepo.find({
        where: { user: { id: userId } },
        order: { date: 'DESC' },
      }),
      this.routineRepo.find({
        where: { creator: { id: userId } },
        relations: ['routineExercises', 'routineExercises.exercise'],
      }),
      this.prRepo.find({
        where: { user: { id: userId } },
        relations: ['exercise'],
      }),
    ]);

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        email: user.email,
        nickname: user.nickname,
        physicalStats: {
          height: user.height,
          initialWeight: user.initialWeight,
          currentPRs: {
            benchPress: user.benchPress1RM,
            squat: user.squat1RM,
            deadlift: user.deadlift1RM,
            overheadPress: user.overheadPress1RM,
          },
        },
      },
      workoutSessions: sessions.map(s => ({
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        totalTime: s.totalTime,
        totalVolume: s.totalVolume,
        routine: s.routine?.name,
        sets: s.workoutSets.map(set => ({
          exercise: set.exercise.name,
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
          volume: set.volume,
        })),
      })),
      bodyRecords: bodyRecords.map(r => ({
        date: r.date,
        weight: r.weight,
        bodyFatPercentage: r.bodyFatPercentage,
        skeletalMuscleMass: r.skeletalMuscleMass,
      })),
      routines: routines.map(r => ({
        name: r.name,
        description: r.description,
        exercises: r.routineExercises.map(re => ({
          exercise: re.exercise.name,
          order: re.exerciseOrder,
          defaultSets: re.defaultSets,
          defaultReps: re.defaultReps,
          defaultWeight: re.defaultWeight,
        })),
      })),
      personalRecords: personalRecords.map(pr => ({
        exercise: pr.exercise.name,
        bestWeight: pr.bestWeight,
        bestReps: pr.bestReps,
        estimated1RM: pr.estimated1RM,
        lastUpdated: pr.updatedAt,
      })),
    };
  }

  async getSyncStatus(userId: number) {
    return {
      lastSyncTime: new Date().toISOString(),
      syncEnabled: true,
      pendingChanges: 0,
    };
  }

  async syncToCloud(userId: number) {
    const backup = await this.createFullBackup(userId);
    
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      dataSize: JSON.stringify(backup).length,
    };
  }
}