import { IsNumber, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateBodyRecordDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  weight: number;

  @IsOptional()
  @IsNumber()
  @Expose({ name: 'body_fat_percentage' })
  bodyFatPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Expose({ name: 'skeletal_muscle_mass' })
  skeletalMuscleMass?: number;
}