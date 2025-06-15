import { IsNumber, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';
import { Expose } from 'class-transformer';

export class InitialProfileDto {
  @Expose()
  @IsNumber()
  @Min(100)
  @Max(250)
  height: number;

  @Expose()
  @IsNumber()
  @Min(30)
  @Max(300)
  weight: number;

  @Expose()
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  benchPress1RM?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  squat1RM?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  deadlift1RM?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  overheadPress1RM?: number;

  @Expose()
  @IsOptional()
  @IsEnum(['kg', 'lbs'])
  preferredUnit?: 'kg' | 'lbs';
}