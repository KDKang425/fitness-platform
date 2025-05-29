import { IsOptional, IsDateString, IsBoolean, IsString, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class FinishWorkoutSessionDto {
  @IsOptional()
  @IsDateString()
  @Expose({ name: 'end_time' })
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  postToFeed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  postContent?: string;

  @IsOptional()
  @IsString()
  postImageUrl?: string;
}