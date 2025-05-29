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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProgramsService } from './user-programs.service';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

@ApiTags('programs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('programs')
export class UserProgramsController {
  constructor(private readonly service: UserProgramsService) {}

  @ApiOperation({ summary: '프로그램 시작' })
  @Post('start/:routineId')
  async startProgram(
    @Req() req: AuthRequest,
    @Param('routineId', ParseIntPipe) routineId: number,
  ) {
    return this.service.startProgram(req.user.userId, routineId);
  }

  @ApiOperation({ summary: '현재 진행 중인 프로그램' })
  @Get('active')
  async getActiveProgram(@Req() req: AuthRequest) {
    return this.service.getActiveProgram(req.user.userId);
  }

  @ApiOperation({ summary: '프로그램 일시정지' })
  @Patch('pause')
  async pauseProgram(@Req() req: AuthRequest) {
    return this.service.pauseProgram(req.user.userId);
  }

  @ApiOperation({ summary: '프로그램 재개' })
  @Patch('resume/:programId')
  async resumeProgram(
    @Req() req: AuthRequest,
    @Param('programId', ParseIntPipe) programId: number,
  ) {
    return this.service.resumeProgram(req.user.userId, programId);
  }

  @ApiOperation({ summary: '프로그램 히스토리' })
  @Get('history')
  async getProgramHistory(@Req() req: AuthRequest) {
    return this.service.getProgramHistory(req.user.userId);
  }
}