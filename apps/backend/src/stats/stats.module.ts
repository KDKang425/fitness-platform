import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PerformanceService } from './performance.service';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutSession,
      WorkoutSet,
      PersonalRecord,
      Exercise,
      User,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService, PerformanceService],
  exports: [StatsService, PerformanceService],
})
export class StatsModule {}