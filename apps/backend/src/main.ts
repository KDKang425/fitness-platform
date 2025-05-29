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
  
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
      keyGenerator: (req: any) => {
        return req.user?.userId || req.ip;
      },
      skip: (req: any) => {
        return req.user?.role === 'admin';
      }
    }),
  );
  
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