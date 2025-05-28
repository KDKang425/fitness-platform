import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(PersonalRecord)
    private readonly prRepo: Repository<PersonalRecord>,
    @InjectRepository(Exercise)
    private readonly exRepo: Repository<Exercise>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  estimate1RM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }

  async updateRecord(
    userId: number,
    exerciseId: number,
    weight: number,
    reps: number,
  ) {
    const est = this.estimate1RM(weight, reps);
    const exist = await this.prRepo.findOne({
      where: { user: { id: userId }, exercise: { id: exerciseId } },
    });
    if (!exist) {
      const pr = this.prRepo.create({
        user: { id: userId } as any,
        exercise: { id: exerciseId } as any,
        bestWeight: weight,
        bestReps: reps,
        estimated1RM: est,
      });
      return this.prRepo.save(pr);
    }
    if (est > exist.estimated1RM) {
      exist.bestWeight = weight;
      exist.bestReps = reps;
      exist.estimated1RM = est;
      return this.prRepo.save(exist);
    }
    return exist;
  }

  getRecord(userId: number, exerciseId: number) {
    return this.prRepo.findOne({
      where: { user: { id: userId }, exercise: { id: exerciseId } },
    });
  }
}