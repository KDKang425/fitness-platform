import { IsOptional, IsDateString } from 'class-validator';

export class PeriodQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
