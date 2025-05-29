import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class RefreshTokenDto {
  @IsString()
  @Expose({ name: 'refresh_token' })
  refreshToken: string;
}
