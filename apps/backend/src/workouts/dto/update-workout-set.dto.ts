import { IsOptional, IsInt, IsPositive, Min } from 'class-validator';

export class UpdateWorkoutSetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @IsPositive()
  weight?: number;
}