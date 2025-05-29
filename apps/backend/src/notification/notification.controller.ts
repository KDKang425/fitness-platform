import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: '알림 목록 조회' })
  @Get()
  async getNotifications(
    @Req() req: AuthRequest,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.notificationService.getNotifications(req.user.userId, page, limit);
  }

  @ApiOperation({ summary: '읽지 않은 알림 개수' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthRequest) {
    const count = await this.notificationService.getUnreadCount(req.user.userId);
    return { count };
  }

  @ApiOperation({ summary: '알림 읽음 처리' })
  @Patch(':id/read')
  async markAsRead(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(req.user.userId, id);
  }

  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  @Post('mark-all-read')
  async markAllAsRead(@Req() req: AuthRequest) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  @ApiOperation({ summary: '알림 설정 조회' })
  @Get('settings')
  async getSettings(@Req() req: AuthRequest) {
    return this.notificationService.getNotificationSettings(req.user.userId);
  }

  @ApiOperation({ summary: '알림 설정 수정' })
  @Patch('settings')
  async updateSettings(
    @Req() req: AuthRequest,
    @Body() dto: any,
  ) {
    return this.notificationService.updateNotificationSettings(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'FCM 토큰 업데이트' })
  @Post('fcm-token')
  async updateFcmToken(
    @Req() req: AuthRequest,
    @Body('token') token: string,
  ) {
    const { usersService } = require('../users/users.service');
    await usersService.updateFcmToken(req.user.userId, token);
    return { success: true };
  }
}