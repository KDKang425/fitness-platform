import { IsOptional, IsInt, IsPositive, Min, IsBoolean } from 'class-validator';

export class UpdateWorkoutSetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @IsPositive()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}