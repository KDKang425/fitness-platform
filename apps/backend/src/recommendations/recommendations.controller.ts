import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationService } from './recommendations.service';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

@ApiTags('recommendations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @ApiOperation({ summary: '맞춤형 프로그램 추천' })
  @ApiResponse({ 
    status: 200, 
    description: '사용자 프로필 기반 프로그램 추천',
    schema: {
      example: [{
        routine: {
          id: 1,
          name: '초보자 3분할 루틴',
          description: '...',
        },
        score: 85,
        matchPercentage: 85,
        reasons: [
          '운동 빈도가 현재 패턴과 잘 맞습니다',
          '선호하는 근육군 운동이 포함되어 있습니다',
          '현재 운동 수준에 적합합니다'
        ]
      }]
    }
  })
  @Get('programs')
  async getRecommendedPrograms(@Req() req: AuthRequest) {
    return this.recommendationService.recommendPrograms(req.user.userId);
  }

  @ApiOperation({ summary: '맞춤형 운동 추천' })
  @ApiResponse({ 
    status: 200, 
    description: '사용자가 시도해볼 만한 새로운 운동 추천' 
  })
  @Get('exercises')
  async getRecommendedExercises(
    @Req() req: AuthRequest,
    @Query('muscleGroup') muscleGroup?: string,
  ) {
    return this.recommendationService.getExerciseRecommendations(
      req.user.userId, 
      muscleGroup
    );
  }

  @ApiOperation({ summary: '다음 운동 제안' })
  @ApiResponse({ 
    status: 200, 
    description: '최근 운동 패턴 기반 다음 운동 제안',
    schema: {
      example: {
        suggestion: 'SHOULDER 운동을 오래 하지 않으셨네요. 오늘은 SHOULDER 운동을 해보는 것은 어떨까요?',
        exercises: [{
          id: 5,
          name: 'Overhead Press',
          category: 'SHOULDER'
        }],
        daysSinceLastWorkout: 2
      }
    }
  })
  @Get('next-workout')
  async getNextWorkoutSuggestion(@Req() req: AuthRequest) {
    return this.recommendationService.getNextWorkoutSuggestion(req.user.userId);
  }
}