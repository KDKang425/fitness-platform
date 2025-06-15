import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Exercise, MuscleGroup, ExerciseModality } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ExerciseFiltersDto } from './dto/exercise-filters.dto';

export interface PlateCalculationResult {
  targetWeight: number;
  barWeight: number;
  perSide: number;
  plates: number[];
  totalPlates: number;
  actualWeight: number;
  difference: number;
  alternativeSolutions?: {
    plates: number[];
    actualWeight: number;
    difference: number;
  }[];
}

@Injectable()
export class ExercisesService {
  private readonly EXERCISE_VIDEOS = {
    'Barbell Bench Press': 'https://youtube.com/watch?v=SCVCLChPQFY',
    'Pull-Up': 'https://youtube.com/watch?v=eGo4IYlbE5g',
    'Barbell Squat': 'https://youtube.com/watch?v=ultWZbUMPL8',
    'Deadlift': 'https://youtube.com/watch?v=VL5Ab0T07e4',
    'Overhead Press': 'https://youtube.com/watch?v=QAQ64hK4Xxs',
    'Barbell Row': 'https://youtube.com/watch?v=kBWAon7ItDw',
    'Bicep Curl': 'https://youtube.com/watch?v=ykJmrZ5v0Oo',
    'Triceps Push-down': 'https://youtube.com/watch?v=2-LAMcpzODU',
  };

  private readonly STANDARD_PLATES = {
    kg: [25, 20, 15, 10, 5, 2.5, 1.25, 1, 0.5, 0.25],
    lbs: [45, 35, 25, 10, 5, 2.5],
  };

  private readonly BAR_WEIGHTS = {
    kg: {
      standard: 20,
      women: 15,
      training: 10,
      ez: 7,
      dumbbell: 2.5,
    },
    lbs: {
      standard: 45,
      women: 35,
      training: 25,
      ez: 15,
      dumbbell: 5,
    },
  };

  private readonly cacheTTL: number;

  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.cacheTTL = this.configService.get('CACHE_EXERCISE_TTL', 3600) * 1000;
  }

  async create(dto: CreateExerciseDto) {
    const existing = await this.exerciseRepo.findOne({ 
      where: { name: dto.name } 
    });
    
    if (existing) {
      throw new ConflictException(`'${dto.name}' 운동이 이미 존재합니다.`);
    }

    const exercise = this.exerciseRepo.create({
      name: dto.name,
      category: dto.muscleGroup as MuscleGroup,
      modality: dto.type as ExerciseModality,
      difficulty: dto.difficulty,
      videoUrl: dto.videoUrl || this.EXERCISE_VIDEOS[dto.name],
      imageUrl: dto.imageUrl,
    });

    try {
      const saved = await this.exerciseRepo.save(exercise);
      await this.invalidateCache();
      return saved;
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('운동 이름은 고유해야 합니다.');
      }
      throw error;
    }
  }

  async findOne(id: number) {
    const cacheKey = `exercise:${id}`;
    const cached = await this.cacheManager.get<Exercise>(cacheKey);
    
    if (cached) {
      return this.transformExercise(cached);
    }

    const exercise = await this.exerciseRepo.findOne({ where: { id } });
    
    if (!exercise) {
      throw new NotFoundException(`ID ${id}인 운동을 찾을 수 없습니다.`);
    }
    
    await this.cacheManager.set(cacheKey, exercise, this.cacheTTL);
    return this.transformExercise(exercise);
  }

  async findAll(filters?: ExerciseFiltersDto) {
    const cacheKey = `exercises:${JSON.stringify(filters || {})}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached && !filters) {
      return cached;
    }

    const query = this.exerciseRepo.createQueryBuilder('exercise');

    if (filters?.muscleGroup) {
      query.andWhere('exercise.category = :muscleGroup', { 
        muscleGroup: filters.muscleGroup 
      });
    }

    if (filters?.type) {
      query.andWhere('exercise.modality = :type', { 
        type: filters.type 
      });
    }

    if (filters?.difficulty) {
      query.andWhere('exercise.difficulty = :difficulty', { 
        difficulty: filters.difficulty 
      });
    }

    if (filters?.search) {
      query.andWhere('exercise.name ILIKE :search', { 
        search: `%${filters.search}%` 
      });
    }

    query.orderBy('exercise.name', 'ASC');

    if (filters?.page && filters?.limit) {
      const skip = (filters.page - 1) * filters.limit;
      query.skip(skip).take(filters.limit);
      
      const [exercises, total] = await query.getManyAndCount();
      
      const result = {
        exercises: exercises.map(e => this.transformExercise(e)),
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      };

      await this.cacheManager.set(cacheKey, result, this.cacheTTL / 2);
      return result;
    }

    const result = await query.getMany();
    const transformed = result.map(e => this.transformExercise(e));
    if (!filters) {
      await this.cacheManager.set(cacheKey, transformed, this.cacheTTL);
    }
    return transformed;
  }

  async getLastRecords(userId: number, exerciseId: number, limit = 5) {
    const records = await this.exerciseRepo
      .createQueryBuilder('exercise')
      .leftJoin('workout_sets', 'set', 'set.exercise_id = exercise.id')
      .leftJoin('workout_sessions', 'session', 'session.id = set.workout_session_id')
      .where('exercise.id = :exerciseId', { exerciseId })
      .andWhere('session.user_id = :userId', { userId })
      .select([
        'set.id as id',
        'session.date as date',
        'set.set_number as set_number',
        'set.reps as reps',
        'set.weight as weight',
        'set.volume as volume'
      ])
      .orderBy('session.date', 'DESC')
      .addOrderBy('set.set_number', 'ASC')
      .limit(limit * 5)
      .getRawMany();

    // Return just the sets for frontend compatibility
    const sets = records.slice(0, limit).map(record => ({
      id: record.id,
      exerciseId: exerciseId,
      weight: record.weight,
      reps: record.reps,
      completed: true
    }));

    return { sets };
  }

  async calculatePlates(
    targetWeight: number, 
    barWeight = 20, 
    availablePlates?: number[],
    unit: 'kg' | 'lbs' = 'kg'
  ): Promise<PlateCalculationResult> {
    if (targetWeight < barWeight) {
      throw new BadRequestException(`목표 무게는 최소 ${barWeight}${unit} (바벨 무게) 이상이어야 합니다.`);
    }

    const weightToLoad = targetWeight - barWeight;
    const perSide = weightToLoad / 2;

    const plates = availablePlates || this.STANDARD_PLATES[unit];
    
    const mainSolution = this.calculateOptimalPlates(perSide, plates);
    
    const alternatives = this.calculateAlternativeSolutions(
      targetWeight, 
      barWeight, 
      plates, 
      unit
    );

    const actualWeight = barWeight + (mainSolution.totalWeight * 2);
    const difference = Math.abs(targetWeight - actualWeight);

    return {
      targetWeight,
      barWeight,
      perSide,
      plates: mainSolution.plates,
      totalPlates: mainSolution.plates.length * 2,
      actualWeight,
      difference,
      alternativeSolutions: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  private calculateOptimalPlates(
    targetPerSide: number, 
    availablePlates: number[]
  ): { plates: number[], totalWeight: number } {
    const plates: number[] = [];
    let remaining = targetPerSide;
    
    const sortedPlates = [...availablePlates].sort((a, b) => b - a);

    for (const plate of sortedPlates) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
      }
    }

    const minPlate = sortedPlates[sortedPlates.length - 1];
    if (remaining >= minPlate / 2) {
      plates.push(minPlate);
      remaining -= minPlate;
    }

    const totalWeight = plates.reduce((sum, p) => sum + p, 0);

    return { plates, totalWeight };
  }

  private calculateAlternativeSolutions(
    targetWeight: number,
    barWeight: number,
    availablePlates: number[],
    unit: 'kg' | 'lbs'
  ): { plates: number[], actualWeight: number, difference: number }[] {
    const alternatives: { plates: number[], actualWeight: number, difference: number }[] = [];
    const range = unit === 'kg' ? 2.5 : 5;
    
    for (let offset = -range; offset <= range; offset += (unit === 'kg' ? 0.5 : 2.5)) {
      if (offset === 0) continue; 
      
      const altTarget = targetWeight + offset;
      if (altTarget < barWeight) continue;
      
      const altPerSide = (altTarget - barWeight) / 2;
      const altSolution = this.calculateOptimalPlates(altPerSide, availablePlates);
      const altActual = barWeight + (altSolution.totalWeight * 2);
      
      alternatives.push({
        plates: altSolution.plates,
        actualWeight: altActual,
        difference: Math.abs(altTarget - altActual),
      });
    }

    return alternatives
      .sort((a, b) => a.difference - b.difference)
      .slice(0, 3);
  }

  async calculateAllPlateCombinations(
    targetWeight: number,
    barWeight = 20,
    availablePlates?: number[],
    unit: 'kg' | 'lbs' = 'kg'
  ) {
    const plates = availablePlates || this.STANDARD_PLATES[unit];
    const perSide = (targetWeight - barWeight) / 2;
    
    const combinations: number[][] = [];
    
    const findCombinations = (
      remaining: number, 
      currentCombo: number[], 
      startIndex: number
    ) => {
      if (Math.abs(remaining) < 0.01) {
        combinations.push([...currentCombo]);
        return;
      }
      
      if (remaining < 0 || startIndex >= plates.length) return;
      
      for (let count = 0; count <= Math.floor(remaining / plates[startIndex]); count++) {
        const newCombo = [...currentCombo];
        for (let i = 0; i < count; i++) {
          newCombo.push(plates[startIndex]);
        }
        findCombinations(
          remaining - (plates[startIndex] * count),
          newCombo,
          startIndex + 1
        );
      }
    };
    
    findCombinations(perSide, [], 0);
    

    const uniqueCombos = combinations
      .map(combo => ({
        plates: combo.sort((a, b) => b - a),
        count: combo.length,
        totalWeight: combo.reduce((sum, p) => sum + p, 0),
      }))
      .filter((combo, index, self) => 
        index === self.findIndex(c => 
          JSON.stringify(c.plates) === JSON.stringify(combo.plates)
        )
      )
      .sort((a, b) => a.count - b.count);
    
    return uniqueCombos.slice(0, 5); 
  }

  private async invalidateCache() {
    await this.cacheManager.del('exercises:all');
    await this.cacheManager.del('exercises:{}');
  }

  private transformExercise(exercise: Exercise) {
    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscle: exercise.category, // Frontend expects 'muscle' field
      type: exercise.modality, // Frontend expects 'type' field  
      modality: exercise.modality,
      difficulty: exercise.difficulty,
      youtubeUrl: exercise.videoUrl, // Frontend expects 'youtubeUrl'
      videoUrl: exercise.videoUrl,
      imageUrl: exercise.imageUrl,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    };
  }
}