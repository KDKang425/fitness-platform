import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export class ExerciseFiltersDto {
  @IsOptional()
  @IsString()
  @Expose({ name: 'muscle_group' })
  muscleGroup?: string;
  
  @IsOptional()
  @IsString()
  type?: string;
  
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;
  
  @IsOptional()
  @IsString()
  search?: string;
  
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;
  
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}