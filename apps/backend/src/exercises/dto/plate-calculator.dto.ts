import { IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class PlateCalculatorDto {
  @IsNumber()
  @Min(0)
  targetWeight: number;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  barWeight?: number = 20;
  
  @IsOptional()
  @IsArray()
  availablePlates?: number[] = [25, 20, 15, 10, 5, 2.5, 1.25];
}