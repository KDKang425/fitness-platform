import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Query,
  Delete,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { CreateWorkoutSetDto } from './dto/create-workout-set.dto';
import { FinishWorkoutSessionDto } from './dto/finish-workout-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/auth-request.interface';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('workouts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @ApiOperation({ summary: '운동 세션 시작' })
  @ApiResponse({ status: 201, description: '세션이 성공적으로 시작됨' })
  @ApiResponse({ status: 404, description: '사용자 또는 루틴을 찾을 수 없음' })
  @Post()
  startSession(
    @Req() req: AuthRequest,
    @Body() dto: CreateWorkoutSessionDto,
  ) {
    return this.workoutsService.startSession({
      ...dto,
      userId: req.user.userId,
    });
  }

  @ApiOperation({ summary: '운동 세션 일시정지' })
  @ApiResponse({ status: 200, description: '세션이 성공적으로 일시정지됨' })
  @ApiResponse({ status: 400, description: '유효하지 않은 세션' })
  @Patch(':id/pause')
  pauseSession(@Param('id', ParseIntPipe) id: number) {
    return this.workoutsService.pauseSession(id);
  }

  @ApiOperation({ summary: '운동 세션 재개' })
  @ApiResponse({ status: 200, description: '세션이 성공적으로 재개됨' })
  @ApiResponse({ status: 400, description: '유효하지 않은 세션' })
  @Patch(':id/resume')
  resumeSession(@Param('id', ParseIntPipe) id: number) {
    return this.workoutsService.resumeSession(id);
  }

  @ApiOperation({ summary: '운동 세트 추가' })
  @ApiResponse({ status: 201, description: '세트가 성공적으로 추가됨' })
  @ApiResponse({ status: 404, description: '세션 또는 운동을 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '세션이 이미 종료됨' })
  @Post(':id/sets')
  addSet(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateWorkoutSetDto,
  ) {
    return this.workoutsService.addSet({ ...dto, sessionId: id });
  }

  @ApiOperation({ summary: '운동 세션 종료' })
  @ApiResponse({ status: 200, description: '세션이 성공적으로 종료됨' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '세션이 이미 종료됨' })
  @Patch(':id/finish')
  finishSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinishWorkoutSessionDto,
  ) {
    return this.workoutsService.finishSession(id, dto.endTime);
  }

  @ApiOperation({ summary: '운동 세션 상세 조회' })
  @ApiResponse({ status: 200, description: '세션 정보 반환' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  @Get(':id')
  findSession(@Param('id', ParseIntPipe) id: number) {
    return this.workoutsService.findSession(id);
  }

  @ApiOperation({ summary: '내 운동 세션 목록 조회' })
  @ApiResponse({ status: 200, description: '세션 목록 반환' })
  @Get()
  findMySessions(
    @Req() req: AuthRequest,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('month') month?: string,
  ) {
    return this.workoutsService.findUserSessions(
      req.user.userId,
      page,
      limit,
      month,
    );
  }

  @ApiOperation({ summary: '오늘의 운동 통계' })
  @ApiResponse({ status: 200, description: '오늘의 운동 통계 반환' })
  @Get('today/stats')
  getTodayStats(@Req() req: AuthRequest) {
    return this.workoutsService.getTodayStats(req.user.userId);
  }

  @ApiOperation({ summary: '월별 운동 달력' })
  @ApiResponse({ status: 200, description: '월별 운동 달력 데이터 반환' })
  @Get('calendar/:year/:month')
  async getMonthlyCalendar(
    @Req() req: AuthRequest,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number
  ) {
    return this.workoutsService.getMonthlyCalendar(req.user.userId, year, month);
  }

  @ApiOperation({ summary: '수동 운동 기록 추가' })
  @ApiResponse({ status: 201, description: '운동 기록이 성공적으로 추가됨' })
  @Post('manual')
  async addManualWorkout(
    @Req() req: AuthRequest,
    @Body() dto: any
  ) {
    return this.workoutsService.addManualWorkout(req.user.userId, dto);
  }

  @ApiOperation({ summary: '운동 세트 삭제' })
  @ApiResponse({ status: 200, description: '세트가 성공적으로 삭제됨' })
  @Delete('sets/:setId')
  async deleteSet(
    @Req() req: AuthRequest,
    @Param('setId', ParseIntPipe) setId: number
  ) {
    return this.workoutsService.deleteSet(req.user.userId, setId);
  }
}