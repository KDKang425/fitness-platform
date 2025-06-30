import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutinesController } from './routines.controller';
import { RoutinesService } from './routines.service';
import { Routine } from './entities/routine.entity';
import { RoutineExercise } from './entities/routine-exercise.entity';
import { RoutineSubscription } from '../routine-subscriptions/entities/routine-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Routine, RoutineExercise, RoutineSubscription])],
  controllers: [RoutinesController],
  providers: [RoutinesService],
})
export class RoutinesModule {}
