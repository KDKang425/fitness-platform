import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Req, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

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

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  async getExerciseHistory(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) exerciseId: number,
    @Query('limit', ParseIntPipe) limit = 5
  ) {
    return this.exercisesService.getLastRecords(req.user.userId, exerciseId, limit);
  }
}