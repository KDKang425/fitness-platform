import { IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum ProgressPeriod {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class ExerciseProgressDto {
  @IsNumber()
  exerciseId: number;

  @IsOptional()
  @IsEnum(ProgressPeriod)
  period?: ProgressPeriod = ProgressPeriod.MONTH;
}