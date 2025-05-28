import { IsString, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateExerciseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'muscle_group' })
  muscleGroup?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'video_url' })
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'image_url' })
  imageUrl?: string;
}