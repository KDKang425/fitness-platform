import { IsInt, Min, IsPositive } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateWorkoutSetDto {
  @IsInt()
  @Expose({ name: 'session_id' })
  sessionId: number;

  @IsInt()
  @Expose({ name: 'exercise_id' })
  exerciseId: number;

  @IsInt()
  @Min(1)
  @Expose({ name: 'set_number' })
  setNumber: number;

  @IsInt()
  @Min(1)
  reps: number;

  @IsPositive()
  weight: number; // kg
}
