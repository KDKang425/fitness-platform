import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkoutTemplatesService } from './workout-templates.service';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

@ApiTags('workout-templates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workout-templates')
export class WorkoutTemplatesController {
  constructor(private readonly service: WorkoutTemplatesService) {}

  @ApiOperation({ summary: '운동 템플릿 생성' })
  @ApiResponse({ status: 201, description: '템플릿이 성공적으로 생성됨' })
  @Post()
  create(@Req() req: AuthRequest, @Body() dto: any) {
    return this.service.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: '내 운동 템플릿 목록' })
  @ApiResponse({ status: 200, description: '템플릿 목록 반환' })
  @Get()
  findMyTemplates(@Req() req: AuthRequest) {
    return this.service.findMyTemplates(req.user.userId);
  }

  @ApiOperation({ summary: '빠른 시작 템플릿 목록' })
  @ApiResponse({ status: 200, description: '빠른 시작 템플릿 목록 반환' })
  @Get('quick-start')
  getQuickStartTemplates(@Req() req: AuthRequest) {
    return this.service.getQuickStartTemplates(req.user.userId);
  }

  @ApiOperation({ summary: '템플릿 상세 조회' })
  @ApiResponse({ status: 200, description: '템플릿 정보 반환' })
  @ApiResponse({ status: 404, description: '템플릿을 찾을 수 없음' })
  @Get(':id')
  findOne(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(id, req.user.userId);
  }

  @ApiOperation({ summary: '템플릿 수정' })
  @ApiResponse({ status: 200, description: '템플릿이 성공적으로 수정됨' })
  @Put(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.update(id, req.user.userId, dto);
  }

  @ApiOperation({ summary: '템플릿 삭제' })
  @ApiResponse({ status: 200, description: '템플릿이 성공적으로 삭제됨' })
  @Delete(':id')
  delete(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.delete(id, req.user.userId);
  }
}