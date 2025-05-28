import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoutineSubscriptionsService } from './routine-subscriptions.service';
import { RoutineSubscriptionsController } from './routine-subscriptions.controller';

import { RoutineSubscription } from './entities/routine-subscription.entity';
import { Routine } from '../routines/entities/routine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoutineSubscription, Routine])],
  providers: [RoutineSubscriptionsService],
  controllers: [RoutineSubscriptionsController],
  exports: [RoutineSubscriptionsService],
})
export class RoutineSubscriptionsModule {}
