import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BodyRecordsService } from './body-records.service';
import { CreateBodyRecordDto } from './dto/create-body-record.dto';

@ApiTags('body-records')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('body-records')
export class BodyRecordsController {
  constructor(private readonly svc: BodyRecordsService) {}

  @ApiOperation({ summary: '신체 기록 추가' })
  @Post()
  create(@Req() req, @Body() dto: CreateBodyRecordDto) {
    return this.svc.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: '신체 기록 삭제' })
  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(req.user.userId, id);
  }

  @ApiOperation({ summary: '최근 체중·체지방 추세' })
  @Get('trend')
  trend(
    @Req() req,
    @Query('days', ParseIntPipe) days = 30,
  ) {
    return this.svc.trend(req.user.userId, days);
  }
}
