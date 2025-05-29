import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Routine } from './entities/routine.entity';
import { RoutineExercise } from './entities/routine-exercise.entity';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

interface ListOptions {
  query?: string;
  sort?: 'recent' | 'popular' | 'alphabetical' | 'trending';
  filter?: 'all' | 'mine' | 'public' | 'subscribed';
  page?: number;
  limit?: number;
}

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(Routine)
    private readonly routineRepo: Repository<Routine>,
    @InjectRepository(RoutineExercise)
    private readonly rxRepo: Repository<RoutineExercise>,
  ) {}

  async createRoutine(userId: number, dto: CreateRoutineDto) {
    const seen = new Set<number>();
    for (const ex of dto.exercises) {
      if (seen.has(ex.exerciseId))
        throw new BadRequestException('Duplicate exercise in routine');
      seen.add(ex.exerciseId);
    }

    const routine = await this.routineRepo.save(
      this.routineRepo.create({
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? true,
        creator: { id: userId } as any,
      }),
    );

    const rxPartials = dto.exercises.map((ex, idx) => ({
      routine,
      exercise: { id: ex.exerciseId } as any,
      exerciseOrder: ex.exerciseOrder ?? idx + 1,
      defaultSets: ex.defaultSets ?? 3,
      defaultReps: ex.defaultReps ?? 8,
      defaultWeight: ex.defaultWeight ?? 0,
    }));
    await this.rxRepo.save(this.rxRepo.create(rxPartials));

    return routine;
  }

  async updateRoutine(userId: number, id: number, dto: UpdateRoutineDto) {
    const routine = await this.routineRepo.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!routine) throw new NotFoundException('Routine not found');
    if (routine.creator?.id !== userId) throw new ForbiddenException('권한이 없습니다.');

    if (dto.name) routine.name = dto.name;
    if (dto.description !== undefined) routine.description = dto.description;
    if (dto.isPublic !== undefined) routine.isPublic = dto.isPublic;
    
    await this.routineRepo.save(routine);

    if (dto.exercises) {
      const seen = new Set<number>();
      for (const ex of dto.exercises) {
        if (seen.has(ex.exerciseId))
          throw new BadRequestException('Duplicate exercise in routine');
        seen.add(ex.exerciseId);
      }

      await this.rxRepo.delete({ routine: { id } });

      const rxPartials = dto.exercises.map((ex, idx) => ({
        routine,
        exercise: { id: ex.exerciseId } as any,
        exerciseOrder: ex.exerciseOrder ?? idx + 1,
        defaultSets: ex.defaultSets ?? 3,
        defaultReps: ex.defaultReps ?? 8,
        defaultWeight: ex.defaultWeight ?? 0,
      }));
      await this.rxRepo.save(this.rxRepo.create(rxPartials));
    }

    return routine;
  }

  async deleteRoutine(userId: number, id: number) {
    const routine = await this.routineRepo.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!routine) throw new NotFoundException('Routine not found');
    if (routine.creator?.id !== userId) throw new ForbiddenException('권한이 없습니다.');

    await this.routineRepo.remove(routine);
    return { success: true, message: 'Routine deleted successfully' };
  }

  async changeVisibility(userId: number, id: number, isPublic: boolean) {
    const routine = await this.routineRepo.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!routine) throw new NotFoundException();
    if (routine.creator?.id !== userId) throw new ForbiddenException();

    routine.isPublic = isPublic;
    return this.routineRepo.save(routine);
  }

  async list(userId: number, options: ListOptions = {}) {
    const { query = '', sort = 'recent', filter = 'all', page = 1, limit = 20 } = options;
    
    const qb = this.routineRepo
      .createQueryBuilder('r')
      .leftJoin('r.creator', 'u')
      .select([
        'r.id',
        'r.name',
        'r.description',
        'r.isPublic',
        'r.createdAt',
        'u.id',
        'u.nickname',
      ]);

    switch (filter) {
      case 'mine':
        qb.where('u.id = :uid', { uid: userId });
        break;
      case 'public':
        qb.where('r.isPublic = true');
        break;
      case 'subscribed':
        qb.innerJoin('r.subscribers', 's', 's.user.id = :uid', { uid: userId });
        break;
      default: 
        qb.where('(r.isPublic = true OR u.id = :uid)', { uid: userId });
    }

    if (query) {
      qb.andWhere('(r.name ILIKE :q OR r.description ILIKE :q)', { q: `%${query}%` });
    }

    switch (sort) {
      case 'popular':
        qb.leftJoin('r.subscribers', 'sub')
          .addSelect('COUNT(DISTINCT sub.id)', 'subscriberCount')
          .groupBy('r.id')
          .addGroupBy('u.id')
          .orderBy('subscriberCount', 'DESC');
        break;
      case 'trending':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        qb.leftJoin('r.subscribers', 'sub', 'sub.subscribedAt >= :date', { 
          date: threeMonthsAgo 
        })
          .addSelect('COUNT(DISTINCT sub.id)', 'recentSubscribers')
          .groupBy('r.id')
          .addGroupBy('u.id')
          .orderBy('recentSubscribers', 'DESC');
        break;
      case 'alphabetical':
        qb.orderBy('r.name', 'ASC');
        break;
      default: 
        qb.orderBy('r.createdAt', 'DESC');
    }

    const skip = (page - 1) * limit;
    const [routines, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      routines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async clone(userId: number, id: number, customName?: string) {
    const origin = await this.routineRepo.findOne({
      where: { id, isPublic: true },
      relations: ['routineExercises', 'routineExercises.exercise'],
    });
    
    if (!origin) throw new NotFoundException('공개 루틴을 찾을 수 없습니다.');

    const copy = await this.routineRepo.save(
      this.routineRepo.create({
        name: customName || `${origin.name} (복사본)`,
        description: origin.description,
        creator: { id: userId } as any,
        isPublic: false,
      }),
    );

    const copyRx = origin.routineExercises.map((rx) => ({
      routine: copy,
      exercise: rx.exercise,
      exerciseOrder: rx.exerciseOrder,
      defaultSets: rx.defaultSets,
      defaultReps: rx.defaultReps,
      defaultWeight: rx.defaultWeight,
    }));
    await this.rxRepo.save(this.rxRepo.create(copyRx));

    return copy;
  }

  async findRoutine(id: number, userId?: number) {
    const routine = await this.routineRepo.findOne({
      where: { id },
      relations: [
        'routineExercises',
        'routineExercises.exercise',
        'creator',
        'subscribers',
      ],
    });

    if (!routine) throw new NotFoundException('Routine not found');

    if (!routine.isPublic && routine.creator?.id !== userId) {
      throw new ForbiddenException('이 루틴에 접근할 권한이 없습니다.');
    }

    const subscriberCount = routine.subscribers?.length || 0;

    const isSubscribed = userId 
      ? routine.subscribers?.some(s => s.user?.id === userId) || false
      : false;

    return {
      ...routine,
      subscriberCount,
      isSubscribed,
    };
  }

  async getRoutineStats(userId: number, routineId: number) {
    const routine = await this.routineRepo.findOne({
      where: { id: routineId },
      relations: ['creator', 'workoutSessions'],
    });

    if (!routine) throw new NotFoundException('Routine not found');
    
    if (!routine.isPublic && routine.creator?.id !== userId) {
      throw new ForbiddenException('이 루틴의 통계에 접근할 권한이 없습니다.');
    }

    const totalSessions = routine.workoutSessions?.length || 0;
    const subscriberCount = await this.routineRepo
      .createQueryBuilder('r')
      .leftJoin('r.subscribers', 's')
      .where('r.id = :id', { id: routineId })
      .select('COUNT(DISTINCT s.id)', 'count')
      .getRawOne();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsage = await this.routineRepo
      .createQueryBuilder('r')
      .leftJoin('r.workoutSessions', 'ws')
      .where('r.id = :id', { id: routineId })
      .andWhere('ws.startTime >= :date', { date: thirtyDaysAgo })
      .select('COUNT(DISTINCT ws.id)', 'count')
      .getRawOne();

    return {
      routineId,
      routineName: routine.name,
      totalSessions,
      subscriberCount: Number(subscriberCount?.count || 0),
      recentUsageCount: Number(recentUsage?.count || 0),
      createdAt: routine.createdAt,
      isPublic: routine.isPublic,
    };
  }
}