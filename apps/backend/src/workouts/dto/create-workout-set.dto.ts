import { IsInt, Min, IsPositive, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateWorkoutSetDto {
  @IsOptional()
  @IsInt()
  @Expose({ name: 'session_id' })
  sessionId?: number;

  @IsInt()
  @Expose({ name: 'exercise_id' })
  exerciseId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose({ name: 'set_number' })
  setNumber?: number;

  @IsInt()
  @Min(1)
  reps: number;

  /** kg */
  @IsPositive()
  weight: number;
}