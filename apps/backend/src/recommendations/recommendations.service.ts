import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';
import { Routine } from '../routines/entities/routine.entity';
import { UserProgram } from '../programs/entities/user-program.entity';
import { Exercise } from '../exercises/entities/exercise.entity';

interface UserProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoals: string[];
  workoutFrequency: number;
  preferredMuscleGroups: string[];
  strengthLevel: {
    benchPress: number;
    squat: number;
    deadlift: number;
    total: number;
  };
  recentExercises: { exerciseId: number; frequency: number }[];
}

interface ProgramRecommendation {
  routine: Routine;
  score: number;
  reasons: string[];
  matchPercentage: number;
}

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(PersonalRecord)
    private prRepo: Repository<PersonalRecord>,
    @InjectRepository(Routine)
    private routineRepo: Repository<Routine>,
    @InjectRepository(UserProgram)
    private programRepo: Repository<UserProgram>,
    @InjectRepository(Exercise)
    private exerciseRepo: Repository<Exercise>,
  ) {}

  async recommendPrograms(userId: number): Promise<ProgramRecommendation[]> {
    const userProfile = await this.analyzeUserProfile(userId);
    
    const availableRoutines = await this.getAvailableRoutines(userId);
    
    const recommendations = await Promise.all(
      availableRoutines.map(routine => this.scoreRoutine(routine, userProfile))
    );
    
    return recommendations
      .filter(rec => rec.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private async analyzeUserProfile(userId: number): Promise<UserProfile> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        date: Between(thirtyDaysAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0]),
      },
      relations: ['workoutSets', 'workoutSets.exercise'],
    });

    const personalRecords = await this.prRepo.find({
      where: { user: { id: userId } },
      relations: ['exercise'],
    });

    const totalSessions = await this.sessionRepo.count({ where: { user: { id: userId } } });
    const experienceLevel = this.determineExperienceLevel(totalSessions, user);

    const workoutFrequency = Math.round((recentSessions.length / 30) * 7);

    const muscleGroupFrequency = new Map<string, number>();
    const exerciseFrequency = new Map<number, number>();

    for (const session of recentSessions) {
      for (const set of session.workoutSets) {
        const muscle = set.exercise.category;
        muscleGroupFrequency.set(muscle, (muscleGroupFrequency.get(muscle) || 0) + 1);
        exerciseFrequency.set(set.exercise.id, (exerciseFrequency.get(set.exercise.id) || 0) + 1);
      }
    }

    const preferredMuscleGroups = Array.from(muscleGroupFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([muscle]) => muscle);

    const recentExercises = Array.from(exerciseFrequency.entries())
      .map(([exerciseId, frequency]) => ({ exerciseId, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const strengthLevel = {
      benchPress: user?.benchPress1RM || 0,
      squat: user?.squat1RM || 0,
      deadlift: user?.deadlift1RM || 0,
      total: (user?.benchPress1RM || 0) + (user?.squat1RM || 0) + (user?.deadlift1RM || 0),
    };

    const primaryGoals = this.inferGoals(preferredMuscleGroups, workoutFrequency, recentSessions);

    return {
      experienceLevel,
      primaryGoals,
      workoutFrequency,
      preferredMuscleGroups,
      strengthLevel,
      recentExercises,
    };
  }

  private determineExperienceLevel(
    totalSessions: number, 
    user: User | null
  ): 'beginner' | 'intermediate' | 'advanced' {
    if (totalSessions < 50) return 'beginner';
    if (totalSessions < 200) return 'intermediate';
    
    const totalStrength = (user?.benchPress1RM || 0) + (user?.squat1RM || 0) + (user?.deadlift1RM || 0);
    const bodyweight = user?.initialWeight || 70;
    const relativeStrength = totalStrength / bodyweight;
    
    if (relativeStrength > 4) return 'advanced';
    return 'intermediate';
  }

  private inferGoals(
    preferredMuscleGroups: string[], 
    workoutFrequency: number,
    recentSessions: WorkoutSession[]
  ): string[] {
    const goals: string[] = [];

    if (workoutFrequency >= 5) {
      goals.push('serious_training');
    } else if (workoutFrequency >= 3) {
      goals.push('general_fitness');
    } else {
      goals.push('maintain_health');
    }

    const upperBodyMuscles = ['CHEST', 'BACK', 'SHOULDER', 'BICEPS', 'TRICEPS'];
    const lowerBodyMuscles = ['GLUTES', 'HAMSTRING', 'QUADRICEPS', 'CALVES'];
    
    const upperBodyCount = preferredMuscleGroups.filter(m => upperBodyMuscles.includes(m)).length;
    const lowerBodyCount = preferredMuscleGroups.filter(m => lowerBodyMuscles.includes(m)).length;

    if (upperBodyCount > lowerBodyCount) {
      goals.push('upper_body_focus');
    } else if (lowerBodyCount > upperBodyCount) {
      goals.push('lower_body_focus');
    } else {
      goals.push('balanced_development');
    }

    const avgVolume = recentSessions.reduce((sum, s) => sum + s.totalVolume, 0) / (recentSessions.length || 1);
    if (avgVolume > 10000) {
      goals.push('muscle_building');
    } else if (avgVolume > 5000) {
      goals.push('strength_building');
    }

    return goals;
  }

  private async getAvailableRoutines(userId: number): Promise<Routine[]> {
    const userPrograms = await this.programRepo.find({
      where: { user: { id: userId } },
      select: ['routine'],
    });

    const usedRoutineIds = userPrograms.map(p => p.routine.id);

    const query = this.routineRepo.createQueryBuilder('routine')
      .leftJoinAndSelect('routine.routineExercises', 'routineExercises')
      .leftJoinAndSelect('routineExercises.exercise', 'exercise')
      .leftJoinAndSelect('routine.subscribers', 'subscribers')
      .where('routine.isPublic = true');

    if (usedRoutineIds.length > 0) {
      query.andWhere('routine.id NOT IN (:...usedIds)', { usedIds: usedRoutineIds });
    }

    return query.getMany();
  }

  private async scoreRoutine(
    routine: Routine, 
    userProfile: UserProfile
  ): Promise<ProgramRecommendation> {
    let score = 0;
    const reasons: string[] = [];

    const routineExerciseCount = routine.routineExercises.length;
    const expectedExercisesPerSession = Math.floor(10 / userProfile.workoutFrequency);
    const frequencyDiff = Math.abs(routineExerciseCount - expectedExercisesPerSession);
    const frequencyScore = Math.max(0, 25 - frequencyDiff * 5);
    score += frequencyScore;
    
    if (frequencyScore > 20) {
      reasons.push('운동 빈도가 현재 패턴과 잘 맞습니다');
    }

    const routineMuscles = new Set(
      routine.routineExercises.map(re => re.exercise.category)
    );
    const matchingMuscles = userProfile.preferredMuscleGroups.filter(
      muscle => routineMuscles.has(muscle as any)
    ).length;
    const muscleScore = (matchingMuscles / userProfile.preferredMuscleGroups.length) * 30;
    score += muscleScore;
    
    if (muscleScore > 20) {
      reasons.push('선호하는 근육군 운동이 포함되어 있습니다');
    }

    const routineDifficulty = this.estimateRoutineDifficulty(routine);
    if (routineDifficulty === userProfile.experienceLevel) {
      score += 20;
      reasons.push('현재 운동 수준에 적합합니다');
    } else if (
      (routineDifficulty === 'intermediate' && userProfile.experienceLevel === 'beginner') ||
      (routineDifficulty === 'intermediate' && userProfile.experienceLevel === 'advanced')
    ) {
      score += 10;
    }

    const routineExerciseIds = routine.routineExercises.map(re => re.exercise.id);
    const matchingExercises = userProfile.recentExercises.filter(
      re => routineExerciseIds.includes(re.exerciseId)
    ).length;
    const exerciseScore = Math.min(15, matchingExercises * 3);
    score += exerciseScore;
    
    if (exerciseScore > 10) {
      reasons.push('익숙한 운동들이 포함되어 있습니다');
    }

    const popularityScore = Math.min(10, routine.subscribers?.length || 0);
    score += popularityScore;
    
    if (popularityScore > 5) {
      reasons.push('많은 사용자들이 구독하는 인기 루틴입니다');
    }

    const matchPercentage = Math.round((score / 100) * 100);

    return {
      routine,
      score,
      reasons,
      matchPercentage,
    };
  }

  private estimateRoutineDifficulty(routine: Routine): 'beginner' | 'intermediate' | 'advanced' {
    const exerciseCount = routine.routineExercises.length;
    const totalSets = routine.routineExercises.reduce(
      (sum, re) => sum + (re.defaultSets || 3), 
      0
    );

    const compoundExercises = ['Barbell Bench Press', 'Barbell Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-Up'];
    const compoundCount = routine.routineExercises.filter(
      re => compoundExercises.includes(re.exercise.name)
    ).length;
    const compoundRatio = compoundCount / exerciseCount;

    if (exerciseCount <= 4 && totalSets <= 12 && compoundRatio < 0.5) {
      return 'beginner';
    } else if (exerciseCount >= 8 || totalSets >= 25 || compoundRatio > 0.7) {
      return 'advanced';
    }
    
    return 'intermediate';
  }

  async getExerciseRecommendations(userId: number, muscleGroup?: string) {
    const userProfile = await this.analyzeUserProfile(userId);
    
    const userExerciseIds = userProfile.recentExercises.map(re => re.exerciseId);
    
    const query = this.exerciseRepo.createQueryBuilder('exercise')
      .where('exercise.id NOT IN (:...ids)', { ids: userExerciseIds.length > 0 ? userExerciseIds : [0] });

    if (muscleGroup) {
      query.andWhere('exercise.category = :muscle', { muscle: muscleGroup });
    }

    if (userProfile.experienceLevel === 'beginner') {
      query.andWhere('exercise.difficulty IN (:...difficulties)', { 
        difficulties: ['beginner', 'intermediate'] 
      });
    }

    const exercises = await query.getMany();

    const scoredExercises = exercises.map(exercise => {
      let score = 0;
      const reasons: string[] = [];

      if (userProfile.preferredMuscleGroups.includes(exercise.category)) {
        score += 50;
        reasons.push('선호하는 근육군 운동입니다');
      }

      if (exercise.difficulty === userProfile.experienceLevel) {
        score += 30;
        reasons.push('현재 수준에 적합한 난이도입니다');
      }

      const modalityCount = new Map<string, number>();
      userProfile.recentExercises.forEach(re => {
        const ex = exercises.find(e => e.id === re.exerciseId);
        if (ex) {
          modalityCount.set(ex.modality, (modalityCount.get(ex.modality) || 0) + 1);
        }
      });

      if (!modalityCount.has(exercise.modality) || modalityCount.get(exercise.modality)! < 2) {
        score += 20;
        reasons.push('운동 유형의 다양성을 높여줍니다');
      }

      return {
        exercise,
        score,
        reasons,
      };
    });

    return scoredExercises
      .filter(se => se.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async getNextWorkoutSuggestion(userId: number) {
    const lastSession = await this.sessionRepo.findOne({
      where: { user: { id: userId } },
      relations: ['workoutSets', 'workoutSets.exercise'],
      order: { date: 'DESC' },
    });

    if (!lastSession) {
      return { suggestion: '첫 운동을 시작해보세요!', exercises: [] };
    }

    const daysSinceLastWorkout = Math.floor(
      (Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastWorkout === 0) {
      return { 
        suggestion: '오늘은 충분한 휴식을 취하세요. 근육 회복이 중요합니다!', 
        exercises: [] 
      };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        date: Between(sevenDaysAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0]),
      },
      relations: ['workoutSets', 'workoutSets.exercise'],
    });

    const recentMuscles = new Set<string>();
    recentSessions.forEach(session => {
      session.workoutSets.forEach(set => {
        recentMuscles.add(set.exercise.category);
      });
    });

    const allMuscleGroups = ['CHEST', 'BACK', 'SHOULDER', 'TRICEPS', 'BICEPS', 'ABS', 'GLUTES', 'HAMSTRING', 'QUADRICEPS'];
    const notRecentMuscles = allMuscleGroups.filter(muscle => !recentMuscles.has(muscle));

    let suggestion = '';
    let recommendedExercises: Exercise[] = [];

    if (notRecentMuscles.length > 0) {
      const targetMuscle = notRecentMuscles[0];
      suggestion = `${targetMuscle} 운동을 오래 하지 않으셨네요. 오늘은 ${targetMuscle} 운동을 해보는 것은 어떨까요?`;
      
      recommendedExercises = await this.exerciseRepo.find({
        where: { category: targetMuscle as any },
        take: 3,
      });
    } else {
      suggestion = '모든 근육군을 골고루 운동하고 계시네요! 오늘은 가장 좋아하는 운동을 해보세요.';
      
      const exerciseFrequency = new Map<number, number>();
      recentSessions.forEach(session => {
        session.workoutSets.forEach(set => {
          exerciseFrequency.set(
            set.exercise.id, 
            (exerciseFrequency.get(set.exercise.id) || 0) + 1
          );
        });
      });

      const topExerciseIds = Array.from(exerciseFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

      recommendedExercises = await this.exerciseRepo.findByIds(topExerciseIds);
    }

    return {
      suggestion,
      exercises: recommendedExercises,
      daysSinceLastWorkout,
    };
  }
}