import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { PlateCalculatorDto } from './dto/plate-calculator.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

@ApiTags('exercises')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  create(@Body() dto: CreateExerciseDto) {
    return this.exercisesService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exercisesService.findOne(id);
  }

  @Get()
  findAll() {
    return this.exercisesService.findAll();
  }

  @ApiOperation({ summary: '운동별 최근 기록' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getExerciseHistory(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) exerciseId: number,
    @Query('limit', ParseIntPipe) limit = 5
  ) {
    return this.exercisesService.getLastRecords(req.user.userId, exerciseId, limit);
  }

  @ApiOperation({ summary: '플레이트 계산기' })
  @ApiResponse({ 
    status: 200, 
    description: '필요한 플레이트 계산 결과',
    schema: {
      example: {
        targetWeight: 100,
        barWeight: 20,
        perSide: 40,
        plates: [25, 15],
        totalPlates: 4
      }
    }
  })
  @Post('plate-calculator')
  async calculatePlates(@Body() dto: PlateCalculatorDto) {
    return this.exercisesService.calculatePlates(
      dto.targetWeight,
      dto.barWeight,
      dto.availablePlates
    );
  }
}