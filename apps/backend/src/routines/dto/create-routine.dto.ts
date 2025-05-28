import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type, Expose } from 'class-transformer';

class ExerciseItemDto {
  @IsInt()
  @Expose({ name: 'exercise_id' })
  exerciseId: number;

  @IsOptional()
  @IsInt()
  @Expose({ name: 'exercise_order' })
  exerciseOrder?: number;

  @IsOptional()
  @IsInt()
  @Expose({ name: 'default_sets' })
  defaultSets?: number;

  @IsOptional()
  @IsInt()
  @Expose({ name: 'default_reps' })
  defaultReps?: number;

  @IsOptional()
  @IsInt()
  @Expose({ name: 'default_weight' })
  defaultWeight?: number;
}

export class CreateRoutineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_public' })
  isPublic?: boolean = true;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseItemDto)
  exercises: ExerciseItemDto[];
}