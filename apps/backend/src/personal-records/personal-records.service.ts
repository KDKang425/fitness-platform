import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PersonalRecord } from './entities/personal-record.entity';
import { estimate1RM } from '../common/utils/one-rm.util';

@Injectable()
export class PersonalRecordsService {
  constructor(
    @InjectRepository(PersonalRecord)
    private readonly prRepo: Repository<PersonalRecord>,
  ) {}

  async updateRecord(userId: number, exerciseId: number, weight: number, reps: number) {
    if (!weight || !reps) return;

    const est1RM = estimate1RM(weight, reps);
    let pr = await this.prRepo.findOne({
      where: { user: { id: userId }, exercise: { id: exerciseId } },
    });

    const isBetter =
      !pr ||
      est1RM > pr.estimated1RM ||
      (weight > pr.bestWeight && reps >= pr.bestReps);

    if (!isBetter) return;

    if (!pr) {
      pr = this.prRepo.create({
        user: { id: userId } as any,
        exercise: { id: exerciseId } as any,
      });
    }
    pr.bestWeight = weight;
    pr.bestReps = reps;
    pr.estimated1RM = est1RM;

    await this.prRepo.save(pr);
  }

  listMine(userId: number) {
    return this.prRepo.find({
      where: { user: { id: userId } },
      order: { estimated1RM: 'DESC' },
    });
  }
}
