import { IsOptional, IsInt } from 'class-validator';
export class StartWorkoutSessionDto {
  @IsOptional()
  @IsInt()
  routineId?: number;
}
