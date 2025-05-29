import { IsString, IsArray, IsNumber, IsOptional, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class ManualSetDto {
  @IsNumber()
  setNumber: number;

  @IsNumber()
  reps: number;

  @IsNumber()
  weight: number;
}

class ManualExerciseDto {
  @IsNumber()
  exerciseId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualSetDto)
  sets: ManualSetDto[];
}

export class CreateManualWorkoutDto {
  @IsDateString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualExerciseDto)
  exercises: ManualExerciseDto[];
}