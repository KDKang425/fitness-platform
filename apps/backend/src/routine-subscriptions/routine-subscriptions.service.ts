import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RoutineSubscription } from './entities/routine-subscription.entity';
import { Routine } from '../routines/entities/routine.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RoutineSubscriptionsService {
  constructor(
    @InjectRepository(RoutineSubscription)
    private readonly subRepo: Repository<RoutineSubscription>,
    @InjectRepository(Routine)
    private readonly routineRepo: Repository<Routine>,
  ) {}

  async subscribe(userId: number, routineId: number) {
    const routine = await this.routineRepo.findOneBy({ id: routineId, isPublic: true });
    if (!routine) throw new NotFoundException('Public routine not found');

    const exists = await this.subRepo.findOne({
      where: { user: { id: userId }, routine: { id: routineId } },
    });
    if (exists) throw new ConflictException('Already subscribed');

    const sub = this.subRepo.create({
      user: { id: userId } as User,
      routine,
    });
    return this.subRepo.save(sub);
  }

  async unsubscribe(userId: number, routineId: number) {
    const res = await this.subRepo.delete({
      user: { id: userId },
      routine: { id: routineId },
    });
    if (res.affected === 0) throw new NotFoundException('Subscription not found');
    return { success: true };
  }

  listMine(userId: number) {
    return this.subRepo.find({
      where: { user: { id: userId } },
      relations: ['routine'],
      order: { subscribedAt: 'DESC' },
    });
  }
}
