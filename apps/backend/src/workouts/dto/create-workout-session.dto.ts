import { IsInt, IsOptional, IsDate } from 'class-validator';
import { Type, Expose } from 'class-transformer';

export class CreateWorkoutSessionDto {
  @IsOptional()
  @IsInt()
  @Expose({ name: 'user_id' })
  userId?: number;

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