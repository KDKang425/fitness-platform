import { IsNumber, Min, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateBodyRecordDto {
  @IsNumber() @Min(20)
  weight: number;

  @IsOptional() @IsNumber() @Min(1)
  @Expose({ name: 'body_fat_percentage' })
  bodyFatPercentage?: number;

  @IsOptional() @IsNumber() @Min(1)
  @Expose({ name: 'skeletal_muscle_mass' })
  skeletalMuscleMass?: number;
}
