import { Controller, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

class RegisterTokenDto {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
}

class UnregisterTokenDto {
  token: string;
}

@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(private readonly pushNotificationsService: PushNotificationsService) {}

  @Post('register')
  async registerToken(@Req() req: AuthRequest, @Body() dto: RegisterTokenDto) {
    return await this.pushNotificationsService.registerToken(
      req.user.userId,
      dto.token,
      dto.platform,
      dto.deviceId,
    );
  }

  @Delete('unregister')
  async unregisterToken(@Req() req: AuthRequest, @Body() dto: UnregisterTokenDto) {
    await this.pushNotificationsService.unregisterToken(req.user.userId, dto.token);
    return { success: true };
  }
}