import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { BodyRecord } from '../body-records/entities/body-record.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutSession,
      WorkoutSet,
      BodyRecord,
      PersonalRecord,
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}