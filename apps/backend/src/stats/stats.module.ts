import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutSession, WorkoutSet])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
