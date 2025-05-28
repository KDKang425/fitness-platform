import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Routine } from './entities/routine.entity';
import { RoutineExercise } from './entities/routine-exercise.entity';
import { CreateRoutineDto } from './dto/create-routine.dto';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(Routine)
    private readonly routineRepo: Repository<Routine>,
    @InjectRepository(RoutineExercise)
    private readonly rxRepo: Repository<RoutineExercise>,
  ) {}

  async createRoutine(userId: number, dto: CreateRoutineDto) {
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

  async list(userId: number, q = '', sort = 'recent') {
    const qb = this.routineRepo
      .createQueryBuilder('r')
      .leftJoin('r.creator', 'u')
      .where('(r.isPublic = true OR u.id = :uid)', { uid: userId });

    if (q) qb.andWhere('r.name ILIKE :q', { q: `%${q}%` });

    qb.orderBy('r.createdAt', sort === 'popular' ? 'ASC' : 'DESC');
    return qb.take(30).getMany();
  }

  async clone(userId: number, id: number) {
    const origin = await this.routineRepo.findOne({
      where: { id, isPublic: true },
      relations: ['routineExercises'],
    });
    if (!origin) throw new NotFoundException();

    const copy = await this.routineRepo.save(
      this.routineRepo.create({
        name: origin.name + ' (copy)',
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

  findRoutine(id: number) {
    return this.routineRepo.findOne({
      where: { id },
      relations: ['routineExercises', 'routineExercises.exercise'],
    });
  }
}
