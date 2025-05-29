import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgramsController } from './user-programs.controller';
import { UserProgramsService } from './user-programs.service';
import { UserProgram } from './entities/user-program.entity';
import { Routine } from '../routines/entities/routine.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProgram, Routine, WorkoutSession]),
  ],
  controllers: [UserProgramsController],
  providers: [UserProgramsService],
  exports: [UserProgramsService],
})
export class UserProgramsModule {}