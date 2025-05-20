// src/workouts/dto/create-workout-session.dto.ts
import { IsDate, IsInt, IsOptional } from 'class-validator';
import { Type, Expose } from 'class-transformer';

export class CreateWorkoutSessionDto {
  @IsInt()
  @Expose({ name: 'user_id' })
  userId: number;

  @IsOptional()
  @IsInt()
  @Expose({ name: 'routine_id' })
  routineId?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Expose({ name: 'start_time' })
  startTime?: Date;
}
