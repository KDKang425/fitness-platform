import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { ExportModule } from '../export/export.module';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { BodyRecord } from '../body-records/entities/body-record.entity';
import { Routine } from '../routines/entities/routine.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      WorkoutSession,
      WorkoutSet,
      BodyRecord,
      Routine,
      PersonalRecord,
    ]),
    ExportModule,
  ],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}