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
      return cached;
    }

    const exercise = await this.exerciseRepo.findOne({ where: { id } });
    
    if (!exercise) {
      throw new NotFoundException(`ID ${id}인 운동을 찾을 수 없습니다.`);
    }
    
    await this.cacheManager.set(cacheKey, exercise, this.cacheTTL);
    return exercise;
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
        exercises,
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
    if (!filters) {
      await this.cacheManager.set(cacheKey, result, this.cacheTTL);
    }
    return result;
  }

  async getLastRecords(userId: number, exerciseId: number, limit = 5) {
    const records = await this.exerciseRepo
      .createQueryBuilder('exercise')
      .leftJoin('workout_sets', 'set', 'set.exercise_id = exercise.id')
      .leftJoin('workout_sessions', 'session', 'session.id = set.workout_session_id')
      .where('exercise.id = :exerciseId', { exerciseId })
      .andWhere('session.user_id = :userId', { userId })
      .select([
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

    const groupedByDate = records.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = [];
      }
      acc[record.date].push({
        setNumber: record.set_number,
        reps: record.reps,
        weight: record.weight,
        volume: record.volume
      });
      return acc;
    }, {});

    const result = Object.entries(groupedByDate)
      .slice(0, limit)
      .map(([date, sets]) => ({
        date,
        sets
      }));

    return result;
  }

  async calculatePlates(targetWeight: number, barWeight = 20, availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25]) {
    if (targetWeight < barWeight) {
      throw new BadRequestException(`목표 무게는 최소 ${barWeight}kg (바벨 무게) 이상이어야 합니다.`);
    }

    const weightToLoad = targetWeight - barWeight;
    const perSide = weightToLoad / 2;

    if (perSide % 0.25 !== 0) {
      throw new BadRequestException('무게는 0.5kg 단위(양쪽 0.25kg)로 나누어떨어져야 합니다.');
    }

    const plates: number[] = [];
    let remaining = perSide;

    for (const plate of availablePlates.sort((a, b) => b - a)) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
      }
    }

    if (remaining > 0.01) {
      throw new BadRequestException('사용 가능한 플레이트로 정확한 무게를 만들 수 없습니다.');
    }

    return {
      targetWeight,
      barWeight,
      perSide,
      plates,
      totalPlates: plates.length * 2,
    };
  }

  private async invalidateCache() {
    await this.cacheManager.del('exercises:all');
    await this.cacheManager.del('exercises:{}');
  }
}