import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { AuthRequest } from '../common/interfaces/auth-request.interface';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('routines')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @ApiOperation({ summary: '루틴 생성' })
  @ApiResponse({ status: 201, description: '루틴이 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '중복된 운동이 포함됨' })
  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateRoutineDto) {
    return this.routinesService.createRoutine(req.user.userId, dto);
  }

  @ApiOperation({ summary: '루틴 수정' })
  @ApiResponse({ status: 200, description: '루틴이 성공적으로 수정됨' })
  @ApiResponse({ status: 404, description: '루틴을 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '수정 권한이 없음' })
  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.routinesService.updateRoutine(req.user.userId, id, dto);
  }

  @ApiOperation({ summary: '루틴 삭제' })
  @ApiResponse({ status: 200, description: '루틴이 성공적으로 삭제됨' })
  @ApiResponse({ status: 404, description: '루틴을 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '삭제 권한이 없음' })
  @Delete(':id')
  remove(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.routinesService.deleteRoutine(req.user.userId, id);
  }

  @ApiOperation({ summary: '루틴 공개/비공개 변경' })
  @ApiResponse({ status: 200, description: '공개 상태가 성공적으로 변경됨' })
  @ApiResponse({ status: 404, description: '루틴을 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '변경 권한이 없음' })
  @Patch(':id/visibility')
  changeVisibility(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVisibilityDto,
  ) {
    return this.routinesService.changeVisibility(req.user.userId, id, dto.isPublic);
  }

  @ApiOperation({ summary: '루틴 목록 조회' })
  @ApiResponse({ status: 200, description: '루틴 목록 반환' })
  @Get()
  list(
    @Req() req: AuthRequest,
    @Query('q') q = '',
    @Query('sort') sort: 'recent' | 'popular' | 'alphabetical' = 'recent',
    @Query('filter') filter: 'all' | 'mine' | 'public' | 'subscribed' = 'all',
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.routinesService.list(req.user.userId, {
      query: q,
      sort,
      filter,
      page,
      limit,
    });
  }

  @ApiOperation({ summary: '루틴 상세 조회' })
  @ApiResponse({ status: 200, description: '루틴 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '루틴을 찾을 수 없음' })
  @Get(':id')
  findOne(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.routinesService.findRoutine(id, req.user.userId);
  }

  @ApiOperation({ summary: '공개 루틴 복제' })
  @ApiResponse({ status: 201, description: '루틴이 성공적으로 복제됨' })
  @ApiResponse({ status: 404, description: '루틴을 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '비공개 루틴은 복제할 수 없음' })
  @Post(':id/clone')
  clone(
    @Req() req: AuthRequest, 
    @Param('id', ParseIntPipe) id: number,
    @Body('name') customName?: string,
  ) {
    return this.routinesService.clone(req.user.userId, id, customName);
  }

  @ApiOperation({ summary: '루틴 통계' })
  @ApiResponse({ status: 200, description: '루틴 사용 통계 반환' })
  @Get(':id/stats')
  getStats(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.routinesService.getRoutineStats(req.user.userId, id);
  }
}