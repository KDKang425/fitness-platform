import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { WorkoutsGateway } from './workouts.gateway';
import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutSet } from './entities/workout-set.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import { User } from '../users/entities/user.entity';
import { Routine } from '../routines/entities/routine.entity';
import { AuthModule } from '../auth/auth.module';
import { StatsModule } from '../stats/stats.module';
import { PersonalRecordsModule } from '../personal-records/personal-records.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutSession, WorkoutSet, Exercise, User, Routine]),
    AuthModule,
    StatsModule,
    PersonalRecordsModule,
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, WorkoutsGateway],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}