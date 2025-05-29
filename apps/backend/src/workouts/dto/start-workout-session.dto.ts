import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { WorkoutType } from './create-workout-session.dto';

export class StartWorkoutSessionDto {
  @IsOptional()
  @IsInt()
  routineId?: number;

  @IsOptional()
  @IsInt()
  templateId?: number;

  @IsEnum(WorkoutType)
  type: WorkoutType;
}