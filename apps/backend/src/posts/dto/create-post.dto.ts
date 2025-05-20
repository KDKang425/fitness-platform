// src/posts/dto/create-post.dto.ts
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreatePostDto {
  @IsInt()
  @Expose({ name: 'user_id' })
  userId: number;

  @IsOptional()
  @IsInt()
  @Expose({ name: 'workout_session_id' })
  workoutSessionId?: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'image_url' })
  imageUrl?: string;
}
