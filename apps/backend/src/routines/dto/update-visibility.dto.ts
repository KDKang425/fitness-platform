import { IsBoolean } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateVisibilityDto {
  @IsBoolean()
  @Expose({ name: 'is_public' })
  isPublic: boolean;
}