import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: '대시보드 통계' })
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @ApiOperation({ summary: '사용자 통계' })
  @Get('users')
  async getUsers(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUserStats(page, limit, search);
  }

  @ApiOperation({ summary: '성장 통계' })
  @Get('growth')
  async getGrowth(
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
  ) {
    return this.adminService.getGrowthStats(period);
  }

  @ApiOperation({ summary: '참여도 통계' })
  @Get('engagement')
  async getEngagement() {
    return this.adminService.getEngagementStats();
  }

  @ApiOperation({ summary: '사용자 차단' })
  @Post('users/:id/ban')
  async banUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.banUser(id);
  }

  @ApiOperation({ summary: '사용자 차단 해제' })
  @Post('users/:id/unban')
  async unbanUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.unbanUser(id);
  }

  @ApiOperation({ summary: '콘텐츠 삭제' })
  @Delete('content/:type/:id')
  async deleteContent(
    @Param('type') type: 'post' | 'routine',
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteContent(type, id);
  }
}