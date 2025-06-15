import { IsInt, Min, IsPositive, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateWorkoutSetDto {
  @IsOptional()
  @IsInt()
  @Expose({ name: 'session_id' })
  sessionId?: number;

  @Expose()
  @IsInt()
  exerciseId: number;

  @Expose()
  @IsOptional()
  @IsInt()
  @Min(1)
  setNumber?: number;

  @Expose()
  @IsInt()
  @Min(1)
  reps: number;

  /** kg */
  @Expose()
  @IsPositive()
  weight: number;
}