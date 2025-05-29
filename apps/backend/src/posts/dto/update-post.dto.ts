import { IsOptional, IsString, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content: string;

  @IsOptional()
  @IsUrl()
  @Expose({ name: 'image_url' })
  imageUrl: string;
}