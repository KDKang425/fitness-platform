import {
  Controller,
  Get,
  Post,
  Patch,
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
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

interface AuthReq extends Request {
  user: { id: number };
}

@ApiTags('routines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @ApiOperation({ summary: '루틴 생성' })
  @Post()
  create(@Req() req: AuthReq, @Body() dto: CreateRoutineDto) {
    return this.routinesService.createRoutine(req.user.id, dto);
  }

  @ApiOperation({ summary: '루틴 공개/비공개 변경' })
  @Patch(':id/visibility')
  changeVis(
    @Req() req: AuthReq,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVisibilityDto,
  ) {
    return this.routinesService.changeVisibility(req.user.id, id, dto.isPublic);
  }

  @ApiOperation({ summary: '루틴 목록(검색·정렬)' })
  @Get()
  list(
    @Req() req: AuthReq,
    @Query('q') q = '',
    @Query('sort') sort = 'recent',
  ) {
    return this.routinesService.list(req.user.id, q, sort);
  }

  @ApiOperation({ summary: '공개 루틴 복제' })
  @Post(':id/clone')
  clone(@Req() req: AuthReq, @Param('id', ParseIntPipe) id: number) {
    return this.routinesService.clone(req.user.id, id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routinesService.findRoutine(id);
  }
}
