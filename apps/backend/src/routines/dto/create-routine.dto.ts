import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ExerciseItemDto {
  @ApiProperty({ description: '운동 ID', example: 1 })
  @IsInt()
  @Expose({ name: 'exercise_id' })
  exerciseId: number;

  @ApiPropertyOptional({ description: '운동 순서', example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Expose({ name: 'exercise_order' })
  exerciseOrder?: number;

  @ApiPropertyOptional({ description: '기본 세트 수', example: 3, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Expose({ name: 'default_sets' })
  defaultSets?: number;

  @ApiPropertyOptional({ description: '기본 반복 수', example: 8, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Expose({ name: 'default_reps' })
  defaultReps?: number;

  @ApiPropertyOptional({ description: '기본 무게 (kg)', example: 60, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  @Expose({ name: 'default_weight' })
  defaultWeight?: number;
}

export class CreateRoutineDto {
  @ApiProperty({ 
    description: '루틴 이름', 
    example: '월요일 상체 루틴',
    minLength: 1,
    maxLength: 100 
  })
  @IsString()
  @IsNotEmpty({ message: '루틴 이름은 필수입니다.' })
  @MaxLength(100, { message: '루틴 이름은 100자 이하여야 합니다.' })
  name: string;

  @ApiPropertyOptional({ 
    description: '루틴 설명', 
    example: '초보자를 위한 상체 루틴',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '설명은 255자 이하여야 합니다.' })
  description?: string;

  @ApiPropertyOptional({ 
    description: '공개 여부', 
    default: true,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_public' })
  isPublic?: boolean = true;

  @ApiProperty({ 
    description: '운동 목록', 
    type: [ExerciseItemDto],
    minItems: 1,
    maxItems: 30,
    example: [{
      exerciseId: 1,
      exerciseOrder: 1,
      defaultSets: 3,
      defaultReps: 8,
      defaultWeight: 60
    }]
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 운동이 필요합니다.' })
  @ArrayMaxSize(30, { message: '운동은 최대 30개까지 추가할 수 있습니다.' })
  @ValidateNested({ each: true })
  @Type(() => ExerciseItemDto)
  exercises: ExerciseItemDto[];
}