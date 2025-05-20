
import { Controller, Get, Req } from '@nestjs/common';
import { StatsService } from './stats.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// @UseGuards(JwtAuthGuard)

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('weekly')
  getWeekly(@Req() req) {
    return this.statsService.getWeeklyStats(req.user.id ?? 1); // 임시 user.id
  }

  @Get('monthly')
  getMonthly(@Req() req) {
    return this.statsService.getMonthlyStats(req.user.id ?? 1);
  }
}
