import { IsOptional, IsDateString } from 'class-validator';
import { Expose } from 'class-transformer';

export class FinishWorkoutSessionDto {
  @IsOptional()
  @IsDateString()
  @Expose({ name: 'end_time' })
  endTime?: string;
}