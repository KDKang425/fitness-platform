import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoutineSubscriptionsService } from './routine-subscriptions.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

interface AuthRequest extends Request {
  user: { id: number };
}

@ApiTags('routine-subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('routine-subscriptions')
export class RoutineSubscriptionsController {
  constructor(private readonly svc: RoutineSubscriptionsService) {}

  @ApiOperation({ summary: '루틴 구독' })
  @Post(':routineId')
  subscribe(
    @Req() req: AuthRequest,
    @Param('routineId', ParseIntPipe) routineId: number,
  ) {
    return this.svc.subscribe(req.user.id, routineId);
  }

  @ApiOperation({ summary: '루틴 구독 취소' })
  @Delete(':routineId')
  unsubscribe(
    @Req() req: AuthRequest,
    @Param('routineId', ParseIntPipe) routineId: number,
  ) {
    return this.svc.unsubscribe(req.user.id, routineId);
  }

  @ApiOperation({ summary: '내 구독 목록' })
  @Get()
  listMine(@Req() req: AuthRequest) {
    return this.svc.listMine(req.user.id);
  }
}
