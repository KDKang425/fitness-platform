import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise, MuscleGroup, ExerciseModality } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ExerciseFiltersDto } from './dto/exercise-filters.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
  ) {}

  async create(dto: CreateExerciseDto) {
    const existing = await this.exerciseRepo.findOne({ 
      where: { name: dto.name } 
    });
    
    if (existing) {
      throw new ConflictException(`Exercise with name '${dto.name}' already exists`);
    }

    const exercise = this.exerciseRepo.create({
      name: dto.name,
      category: dto.muscleGroup as MuscleGroup,
      modality: dto.type as ExerciseModality,
      difficulty: dto.difficulty,
      videoUrl: dto.videoUrl,
      imageUrl: dto.imageUrl,
    });

    try {
      return await this.exerciseRepo.save(exercise);
    } catch (error: any) {
      if (error?.code === '23505') { // PostgreSQL unique violation
        throw new ConflictException('Exercise name must be unique');
      }
      throw error;
    }
  }

  async findOne(id: number) {
    const exercise = await this.exerciseRepo.findOne({ where: { id } });
    
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    
    return exercise;
  }

  async findAll(filters?: ExerciseFiltersDto) {
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
      
      return {
        exercises,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      };
    }

    return query.getMany();
  }

  async getLastRecords(userId: number, exerciseId: number, limit = 5) {
    const records = await this.exerciseRepo
      .createQueryBuilder('exercise')
      .leftJoinAndSelect('exercise.workoutSets', 'set')
      .leftJoinAndSelect('set.workoutSession', 'session')
      .where('exercise.id = :exerciseId', { exerciseId })
      .andWhere('session.user.id = :userId', { userId })
      .orderBy('session.date', 'DESC')
      .addOrderBy('set.setNumber', 'ASC')
      .limit(limit)
      .getMany();

    return records;
  }

  async calculatePlates(targetWeight: number, barWeight = 20, availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25]) {
    if (targetWeight < barWeight) {
      throw new BadRequestException(`Target weight must be at least ${barWeight}kg (bar weight)`);
    }

    const weightToLoad = targetWeight - barWeight;
    const perSide = weightToLoad / 2;

    if (perSide % 0.25 !== 0) {
      throw new BadRequestException('Weight must be divisible by 0.5kg (0.25kg per side)');
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
      throw new BadRequestException('Cannot make exact weight with available plates');
    }

    return {
      targetWeight,
      barWeight,
      perSide,
      plates,
      totalPlates: plates.length * 2,
    };
  }
}