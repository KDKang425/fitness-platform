import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import './config/typeorm.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  app.setGlobalPrefix('api');
  
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  
  app.use(helmet());
  
  // 인증 관련 엄격한 제한
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 최대 5회 시도
    message: '너무 많은 인증 시도입니다. 잠시 후 다시 시도해주세요.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  });

  // 비밀번호 재설정은 더 엄격하게
  const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 3, // 최대 3회 시도
    message: '비밀번호 재설정 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.',
  });

  // 운동 기록 API는 더 관대하게
  const workoutLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1분
    max: 100, // 운동 중에는 자주 요청할 수 있음
    keyGenerator: (req: any) => {
      return req.user?.userId || req.ip;
    },
  });

  // 일반 API 요청 제한
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100회
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    keyGenerator: (req: any) => {
      return req.user?.userId || req.ip;
    },
    skip: (req: any) => {
      // 관리자는 제한 없음
      return req.user?.role === 'admin';
    }
  });

  // 파일 업로드 제한
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 20, // 시간당 20개 파일
    message: '파일 업로드 제한에 도달했습니다. 1시간 후 다시 시도해주세요.',
  });

  // 검색 API 제한
  const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1분
    max: 30, // 분당 30회
    message: '검색 요청이 너무 많습니다.',
  });

  // Rate limiter 적용
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/request-password-reset', passwordResetLimiter);
  app.use('/api/v1/auth/reset-password', passwordResetLimiter);
  app.use('/api/v1/workouts*', workoutLimiter);
  app.use('/api/v1/upload*', uploadLimiter);
  app.use('/api/v1/*/search', searchLimiter);
  app.use('/api/v1/users/search', searchLimiter);
  app.use('/api/v1/routines?*', searchLimiter);
  app.use(generalLimiter);
  
  app.useGlobalFilters(new HttpExceptionFilter());
  
  app.useGlobalInterceptors(new ResponseInterceptor());
  
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,                    
      transformOptions: {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      },
      whitelist: true,                   
      forbidNonWhitelisted: true,        
      errorHttpStatusCode: 422,         
    }),
  );

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', ['http://localhost:3000']),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fitness Platform API')
    .setDescription('피트니스 플랫폼 API 문서')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', '인증 관련 API')
    .addTag('users', '사용자 관련 API')
    .addTag('workouts', '운동 세션 관련 API')
    .addTag('exercises', '운동 종목 관련 API')
    .addTag('routines', '루틴 관련 API')
    .addTag('stats', '통계 관련 API')
    .addTag('posts', '피드 관련 API')
    .addTag('upload', '파일 업로드 API')
    .addTag('admin', '관리자 API')
    .addTag('notifications', '알림 API')
    .addTag('export', '데이터 내보내기 API')
    .addTag('templates', '운동 템플릿 API')
    .addTag('recommendations', '추천 API')
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDoc, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('port', 3001);
  await app.listen(port);
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();