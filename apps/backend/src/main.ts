import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import './config/typeorm.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // HttpExceptionFilter를 먼저 설정
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // ValidationPipe 설정 - transform: true가 class-transformer를 활성화
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,                    // class-transformer 활성화
      transformOptions: {
        enableImplicitConversion: true,   // 암시적 타입 변환 활성화
      },
      whitelist: true,                   // DTO에 없는 속성 제거
      forbidNonWhitelisted: true,        // 허용되지 않은 속성이 있으면 에러
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: '*',
  });

  // Swagger 설정
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fitness Platform API')
    .setDescription('피트니스 플랫폼 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDoc);

  // 서버 시작
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}

bootstrap();