import { IsNumber, IsOptional } from 'class-validator';

export class InitialProfileDto {
  @IsNumber()
  height: number;

  @IsNumber() 
  weight: number;

  @IsOptional()
  @IsNumber()
  benchPress1RM?: number;

  @IsOptional()
  @IsNumber()
  squat1RM?: number;

  @IsOptional()
  @IsNumber()
  deadlift1RM?: number;
}