import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { RecoveryService } from './recovery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PeriodQueryDto } from './dto/period-query.dto';
import { ExerciseProgressDto } from './dto/exercise-progress.dto';
import { AuthRequest } from '../common/interfaces/auth-request.interface';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('stats')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly recoveryService: RecoveryService,
  ) {}

  @ApiOperation({ summary: '주간 통계 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '주간 통계 반환 (총 볼륨, 근육별 볼륨, 전주 대비 증감률)' 
  })
  @Get('weekly')
  weekly(@Req() req: AuthRequest, @Query() q: PeriodQueryDto) {
    const base = q.date ? new Date(q.date) : new Date();
    return this.statsService.getWeeklyStats(req.user.userId, base);
  }

  @ApiOperation({ summary: '월간 통계 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '월간 통계 반환 (총 볼륨, 근육별 볼륨, 전월 대비 증감률)' 
  })
  @Get('monthly')
  monthly(@Req() req: AuthRequest, @Query() q: PeriodQueryDto) {
    const base = q.date ? new Date(q.date) : new Date();
    return this.statsService.getMonthlyStats(req.user.userId, base);
  }

  @ApiOperation({ summary: '운동별 발전 추이' })
  @ApiResponse({ 
    status: 200, 
    description: '특정 운동의 발전 추이 데이터 반환' 
  })
  @Get('progress/exercises')
  async getExerciseProgress(
    @Req() req: AuthRequest,
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
  ) {
    return this.statsService.getExerciseProgress(req.user.userId, period);
  }

  @ApiOperation({ summary: '특정 운동 상세 진행도' })
  @ApiResponse({ 
    status: 200, 
    description: '특정 운동의 상세 진행도 그래프 데이터' 
  })
  @Get('progress/exercise/:exerciseId')
  async getSpecificExerciseProgress(
    @Req() req: AuthRequest,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Query() dto: ExerciseProgressDto,
  ) {
    return this.statsService.getSpecificExerciseProgress(
      req.user.userId,
      exerciseId,
      dto.period
    );
  }

  @ApiOperation({ summary: '예상 1RM 변화 추이' })
  @ApiResponse({ 
    status: 200, 
    description: '주요 운동별 1RM 변화 추이' 
  })
  @Get('progress/1rm-trends')
  async get1RMTrends(@Req() req: AuthRequest) {
    return this.statsService.get1RMProgressTrends(req.user.userId);
  }

  @ApiOperation({ summary: '운동 빈도 통계' })
  @ApiResponse({ 
    status: 200, 
    description: '요일별, 시간대별 운동 빈도 통계' 
  })
  @Get('frequency')
  async getWorkoutFrequency(@Req() req: AuthRequest) {
    return this.statsService.getWorkoutFrequency(req.user.userId);
  }

  @ApiOperation({ summary: '근육 사용도 히트맵' })
  @ApiResponse({ 
    status: 200, 
    description: '최근 30일간 근육 사용도 히트맵 데이터' 
  })
  @Get('muscle-heatmap')
  async getMuscleHeatmap(@Req() req: AuthRequest) {
    return this.statsService.getMuscleHeatmap(req.user.userId);
  }

  @ApiOperation({ summary: '근육 회복 상태' })
  @ApiResponse({ 
    status: 200, 
    description: '각 근육군별 회복 상태 및 다음 운동 추천 시간' 
  })
  @Get('recovery/status')
  async getMuscleRecoveryStatus(@Req() req: AuthRequest) {
    return this.recoveryService.getMuscleRecoveryStatus(req.user.userId);
  }

  @ApiOperation({ summary: '최적 운동 분할 추천' })
  @ApiResponse({ 
    status: 200, 
    description: '사용자 운동 패턴 기반 최적 분할 추천' 
  })
  @Get('recovery/optimal-split')
  async getOptimalSplit(@Req() req: AuthRequest) {
    return this.recoveryService.getOptimalWorkoutSplit(req.user.userId);
  }

  @ApiOperation({ summary: '개인 기록 대시보드' })
  @ApiResponse({ 
    status: 200, 
    description: '주요 운동별 PR과 최근 업데이트 정보' 
  })
  @Get('dashboard')
  async getDashboard(@Req() req: AuthRequest) {
    return this.statsService.getDashboardStats(req.user.userId);
  }

  @ApiOperation({ summary: '주요 운동 1RM 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '3대 운동 + OHP 1RM 정보',
    schema: {
      example: {
        benchPress: { weight: 100, reps: 1, estimated1RM: 100, lastUpdated: '2024-01-01' },
        squat: { weight: 140, reps: 5, estimated1RM: 157, lastUpdated: '2024-01-01' },
        deadlift: { weight: 180, reps: 3, estimated1RM: 191, lastUpdated: '2024-01-01' },
        overheadPress: { weight: 60, reps: 8, estimated1RM: 74, lastUpdated: '2024-01-01' }
      }
    }
  })
  @Get('main-lifts')
  async getMainLifts1RM(@Req() req: AuthRequest) {
    return this.statsService.getMainLifts1RM(req.user.userId);
  }

  @ApiOperation({ summary: '운동 볼륨 추세' })
  @ApiResponse({ 
    status: 200, 
    description: '주간/월간 볼륨 추세 분석' 
  })
  @Get('trends/volume')
  async getVolumeTrends(
    @Req() req: AuthRequest,
    @Query('period') period: 'week' | 'month' = 'week',
    @Query('duration') duration: number = 12,
  ) {
    return this.statsService.getVolumeTrends(req.user.userId, period, duration);
  }
}