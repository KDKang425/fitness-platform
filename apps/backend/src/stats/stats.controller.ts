import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PeriodQueryDto } from './dto/period-query.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

interface AuthRequest extends Request {
  user: { id: number };
}

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @ApiOperation({ summary: '주간 통계(총 볼륨·근육별 볼륨·증감률)' })
  @Get('weekly')
  weekly(@Req() req: AuthRequest, @Query() q: PeriodQueryDto) {
    const base = q.date ? new Date(q.date) : new Date();
    return this.statsService.getWeeklyStats(req.user.id, base);
  }

  @ApiOperation({ summary: '월간 통계(총 볼륨·근육별 볼륨·증감률)' })
  @Get('monthly')
  monthly(@Req() req: AuthRequest, @Query() q: PeriodQueryDto) {
    const base = q.date ? new Date(q.date) : new Date();
    return this.statsService.getMonthlyStats(req.user.id, base);
  }
}
