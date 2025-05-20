// src/workouts/workouts.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { CreateWorkoutSetDto } from './dto/create-workout-set.dto';
import { FinishWorkoutSessionDto } from './dto/finish-workout-session.dto';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  startSession(@Body() dto: CreateWorkoutSessionDto) {
    return this.workoutsService.startSession(dto);
  }

  @Post(':id/sets')
  addSet(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateWorkoutSetDto,
  ) {
    return this.workoutsService.addSet({ ...dto, sessionId: id });
  }

  @Patch(':id/finish')
  finishSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinishWorkoutSessionDto,
  ) {
    return this.workoutsService.finishSession(id, dto.endTime);
  }

  @Get(':id')
  findSession(@Param('id', ParseIntPipe) id: number) {
    return this.workoutsService.findSession(id);
  }

  @Get()
  findAll() {
    return this.workoutsService.findAllSessions();
  }
}
