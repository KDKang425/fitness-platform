import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationService } from './recommendations.service';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';
import { Routine } from '../routines/entities/routine.entity';
import { UserProgram } from '../programs/entities/user-program.entity';
import { Exercise } from '../exercises/entities/exercise.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      WorkoutSession,
      PersonalRecord,
      Routine,
      UserProgram,
      Exercise,
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationsModule {}