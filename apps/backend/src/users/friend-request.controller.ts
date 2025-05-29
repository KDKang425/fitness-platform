import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendRequestService } from './friend-request.service';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

@ApiTags('friend-requests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('friend-requests')
export class FriendRequestController {
  constructor(private readonly friendRequestService: FriendRequestService) {}

  @ApiOperation({ summary: '친구 요청 보내기' })
  @Post(':recipientId')
  async sendRequest(
    @Req() req: AuthRequest,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ) {
    return this.friendRequestService.sendFriendRequest(req.user.userId, recipientId);
  }

  @ApiOperation({ summary: '친구 요청 수락' })
  @Post(':requesterId/accept')
  async acceptRequest(
    @Req() req: AuthRequest,
    @Param('requesterId', ParseIntPipe) requesterId: number,
  ) {
    return this.friendRequestService.acceptFriendRequest(req.user.userId, requesterId);
  }

  @ApiOperation({ summary: '친구 요청 거절' })
  @Post(':requesterId/reject')
  async rejectRequest(
    @Req() req: AuthRequest,
    @Param('requesterId', ParseIntPipe) requesterId: number,
  ) {
    return this.friendRequestService.rejectFriendRequest(req.user.userId, requesterId);
  }

  @ApiOperation({ summary: '친구 요청 목록' })
  @Get()
  async getPendingRequests(@Req() req: AuthRequest) {
    return this.friendRequestService.getPendingRequests(req.user.userId);
  }

  @ApiOperation({ summary: '친구 요청 취소' })
  @Delete(':recipientId')
  async cancelRequest(
    @Req() req: AuthRequest,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ) {
    return this.friendRequestService.cancelFriendRequest(req.user.userId, recipientId);
  }

  @ApiOperation({ summary: '친구 관계 해제' })
  @Delete('friends/:friendId')
  async removeFriend(
    @Req() req: AuthRequest,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    return this.friendRequestService.removeFriend(req.user.userId, friendId);
  }
}