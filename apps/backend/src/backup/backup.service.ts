import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { BodyRecord } from '../body-records/entities/body-record.entity';
import { Routine } from '../routines/entities/routine.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import { validate } from 'class-validator';
import * as crypto from 'crypto';

interface BackupData {
  version: string;
  exportDate: string;
  checksum?: string;
  user: any;
  workoutSessions: any[];
  bodyRecords: any[];
  routines: any[];
  personalRecords: any[];
}

@Injectable()
export class BackupService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(WorkoutSession) private sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet) private setRepo: Repository<WorkoutSet>,
    @InjectRepository(BodyRecord) private bodyRecordRepo: Repository<BodyRecord>,
    @InjectRepository(Routine) private routineRepo: Repository<Routine>,
    @InjectRepository(PersonalRecord) private prRepo: Repository<PersonalRecord>,
    @InjectRepository(Exercise) private exerciseRepo: Repository<Exercise>,
    private dataSource: DataSource,
  ) {}

  async createFullBackup(userId: number): Promise<BackupData> {
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

    const backupData = {
      version: '2.0',
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
        id: s.id,
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
        id: r.id,
        date: r.date,
        weight: r.weight,
        bodyFatPercentage: r.bodyFatPercentage,
        skeletalMuscleMass: r.skeletalMuscleMass,
      })),
      routines: routines.map(r => ({
        id: r.id,
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

    const dataString = JSON.stringify(backupData);
    backupData.checksum = crypto.createHash('sha256').update(dataString).digest('hex');

    return backupData;
  }

  async restoreFromBackup(userId: number, backupData: BackupData): Promise<any> {
    if (!this.validateBackupData(backupData)) {
      throw new BadRequestException('백업 데이터가 손상되었거나 형식이 올바르지 않습니다.');
    }

    const supportedVersions = ['1.0', '2.0'];
    if (!supportedVersions.includes(backupData.version)) {
      throw new BadRequestException('지원하지 않는 백업 버전입니다.');
    }

    if (backupData.checksum) {
      const tempChecksum = backupData.checksum;
      delete backupData.checksum;
      const calculatedChecksum = crypto.createHash('sha256')
        .update(JSON.stringify(backupData))
        .digest('hex');
      
      if (tempChecksum !== calculatedChecksum) {
        throw new BadRequestException('백업 데이터가 손상되었습니다.');
      }
      backupData.checksum = tempChecksum;
    }

    return this.dataSource.transaction(async manager => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new BadRequestException('사용자를 찾을 수 없습니다.');
      }

      const restoredData = {
        routines: 0,
        sessions: 0,
        bodyRecords: 0,
        personalRecords: 0,
        skippedSessions: [],
        errors: [],
      };

      try {
        const exerciseMap = new Map<string, number>();
        const exercises = await manager.find(Exercise);
        exercises.forEach(ex => exerciseMap.set(ex.name, ex.id));

        for (const routineData of backupData.routines || []) {
          try {
            const existingRoutine = await manager.findOne(Routine, {
              where: { 
                name: routineData.name, 
                creator: { id: userId } 
              }
            });

            if (!existingRoutine) {
              const routine = manager.create(Routine, {
                name: routineData.name,
                description: routineData.description,
                creator: user,
                isPublic: false,
              });
              
              await manager.save(routine);
              restoredData.routines++;
            }
          } catch (error) {
            restoredData.errors.push(`루틴 복원 실패: ${routineData.name}`);
          }
        }

        for (const sessionData of backupData.workoutSessions || []) {
          try {
            const existingSession = await manager.findOne(WorkoutSession, {
              where: {
                user: { id: userId },
                date: sessionData.date,
                startTime: sessionData.startTime,
              }
            });

            if (existingSession) {
              restoredData.skippedSessions.push({
                date: sessionData.date,
                reason: '중복된 세션',
              });
              continue;
            }

            const session = manager.create(WorkoutSession, {
              user,
              date: sessionData.date,
              startTime: sessionData.startTime ? new Date(sessionData.startTime) : null,
              endTime: sessionData.endTime ? new Date(sessionData.endTime) : null,
              totalTime: sessionData.totalTime,
              totalVolume: 0,
            });

            const savedSession = await manager.save(session);
            let totalVolume = 0;

            for (const setData of sessionData.sets || []) {
              const exerciseId = exerciseMap.get(setData.exercise);
              if (!exerciseId) continue;

              const set = manager.create(WorkoutSet, {
                workoutSession: savedSession,
                exercise: { id: exerciseId } as any,
                setNumber: setData.setNumber,
                reps: setData.reps,
                weight: setData.weight,
                volume: setData.volume || setData.reps * setData.weight,
              });
              
              await manager.save(set);
              totalVolume += set.volume;
            }

            savedSession.totalVolume = totalVolume;
            await manager.save(savedSession);
            restoredData.sessions++;
          } catch (error) {
            restoredData.errors.push(`세션 복원 실패: ${sessionData.date}`);
          }
        }

        for (const recordData of backupData.bodyRecords || []) {
          try {
            const existingRecord = await manager.findOne(BodyRecord, {
              where: {
                user: { id: userId },
                date: recordData.date,
              }
            });

            if (!existingRecord) {
              const record = manager.create(BodyRecord, {
                user,
                date: recordData.date,
                weight: recordData.weight,
                bodyFatPercentage: recordData.bodyFatPercentage,
                skeletalMuscleMass: recordData.skeletalMuscleMass,
              });
              
              await manager.save(record);
              restoredData.bodyRecords++;
            }
          } catch (error) {
            restoredData.errors.push(`체중 기록 복원 실패: ${recordData.date}`);
          }
        }

        for (const prData of backupData.personalRecords || []) {
          try {
            const exerciseId = exerciseMap.get(prData.exercise);
            if (!exerciseId) continue;

            const existingPR = await manager.findOne(PersonalRecord, {
              where: {
                user: { id: userId },
                exercise: { id: exerciseId },
              }
            });

            if (!existingPR || prData.estimated1RM > existingPR.estimated1RM) {
              await manager.upsert(PersonalRecord, {
                user: { id: userId } as any,
                exercise: { id: exerciseId } as any,
                bestWeight: prData.bestWeight,
                bestReps: prData.bestReps,
                estimated1RM: prData.estimated1RM,
              }, ['user', 'exercise']);
              
              restoredData.personalRecords++;
            }
          } catch (error) {
            restoredData.errors.push(`개인 기록 복원 실패: ${prData.exercise}`);
          }
        }

        return {
          success: true,
          message: '백업 복원이 완료되었습니다.',
          restoredData,
        };
      } catch (error) {
        throw new BadRequestException('백업 복원 중 오류가 발생했습니다.');
      }
    });
  }

  private validateBackupData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.exportDate) return false;
    if (!data.user || typeof data.user !== 'object') return false;
    
    const requiredArrays = ['workoutSessions', 'bodyRecords', 'routines', 'personalRecords'];
    for (const key of requiredArrays) {
      if (!Array.isArray(data[key])) return false;
    }
    
    return true;
  }

  async getSyncStatus(userId: number) {
    const lastBackup = await this.getLastBackupTime(userId);
    const hasChanges = await this.checkForChanges(userId, lastBackup);
    
    return {
      lastSyncTime: lastBackup?.toISOString() || null,
      syncEnabled: true,
      pendingChanges: hasChanges ? 1 : 0,
      autoBackupEnabled: false,
    };
  }

  private async getLastBackupTime(userId: number): Promise<Date | null> {
    return null;
  }

  private async checkForChanges(userId: number, since: Date | null): Promise<boolean> {
    if (!since) return true;
    
    const recentSession = await this.sessionRepo.findOne({
      where: { 
        user: { id: userId },
        updatedAt: new Date(since.getTime() + 1)
      },
      order: { updatedAt: 'DESC' },
    });
    
    return !!recentSession;
  }

  async syncToCloud(userId: number) {
    const backup = await this.createFullBackup(userId);
    
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      dataSize: JSON.stringify(backup).length,
      recordCount: {
        sessions: backup.workoutSessions.length,
        bodyRecords: backup.bodyRecords.length,
        routines: backup.routines.length,
        personalRecords: backup.personalRecords.length,
      },
    };
  }
}