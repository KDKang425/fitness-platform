import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class InitialProfileDto {
  @IsNumber()
  @Min(100)
  @Max(250)
  height: number;

  @IsNumber()
  @Min(30)
  @Max(300)
  weight: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  benchPress1RM?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  squat1RM?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  deadlift1RM?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  overheadPress1RM?: number;
}