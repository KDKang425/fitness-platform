import { Injectable } from '@nestjs/common';
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
    private readonly routineExerciseRepo: Repository<RoutineExercise>,
  ) {}

  async createRoutine(dto: CreateRoutineDto) {
    const routine = this.routineRepo.create({
      name: dto.name,
      description: dto.description,
      isPublic: dto.isPublic ?? true,
    });
    const savedRoutine = await this.routineRepo.save(routine);

    if (dto.exercises?.length) {
      const routineExercises: RoutineExercise[] = dto.exercises.map((ex) =>
        this.routineExerciseRepo.create({
          routine: savedRoutine,
          exercise: { id: ex.exerciseId } as any,
          exerciseOrder: ex.exerciseOrder ?? 1,     
          defaultSets: ex.defaultSets ?? 3,
          defaultReps: ex.defaultReps ?? 8,
          ...(ex.defaultWeight !== undefined
            ? { defaultWeight: ex.defaultWeight }
            : {}),
        }),
      );

      await this.routineExerciseRepo.save(routineExercises);
    }

    return savedRoutine;
  }

  findRoutine(id: number) {
    return this.routineRepo.findOne({
      where: { id },
      relations: [
        'routineExercises',
        'routineExercises.exercise',
      ],
    });
  }

  findAllRoutines() {
    return this.routineRepo.find({
      relations: ['routineExercises'],
    });
  }
}
