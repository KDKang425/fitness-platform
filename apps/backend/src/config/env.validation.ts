// apps/backend/src/config/env.validation.ts - 개발용 수정

import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, IsOptional, validateSync, IsNotEmpty, Min, Max, IsIn, IsUrl } from 'class-validator';

export class EnvironmentVariables {
  @IsNumber()
  @IsOptional()
  PORT?: number = 3001;

  @IsString()
  @IsOptional()
  DB_HOST?: string = 'localhost';

  @IsNumber()
  @IsOptional()
  DB_PORT?: number = 5432;

  @IsString()
  @IsOptional()
  DB_USERNAME?: string = 'postgres';

  @IsString()
  @IsOptional()
  DB_PASSWORD?: string = 'postgres';

  @IsString()
  @IsOptional()
  DB_DATABASE?: string = 'fitness_db';

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required. Please set it in your environment variables.' })
  JWT_SECRET!: string; // Required - no default value

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string = '1h';

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsNumber()
  REDIS_PORT?: number;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string = '*';

  @IsOptional()
  @IsString()
  UPLOAD_DIR?: string = './uploads';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  SENDGRID_API_KEY?: string;

  @IsOptional()
  @IsString()
  FIREBASE_PROJECT_ID?: string;

  @IsOptional()
  @IsString()
  FIREBASE_CLIENT_EMAIL?: string;

  @IsOptional()
  @IsString()
  FIREBASE_PRIVATE_KEY?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400)
  CACHE_EXERCISE_TTL?: number = 3600;

  // 🔧 개발용: URL 검증 완화
  @IsString()
  @IsOptional()
  FRONTEND_URL?: string = 'http://localhost:3000';

  @IsOptional()
  @IsString()
  EMAIL_FROM?: string = 'noreply@example.com';

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsNumber()
  SMTP_PORT?: number;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  // 🔧 개발용: URL 검증 완화
  @IsString()
  @IsOptional()
  BASE_URL?: string = 'http://localhost:3001';

  @IsString()
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string = 'development';

  @IsOptional()
  @IsString()
  AWS_REGION?: string;

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  MAX_FILE_SIZE_MB?: number = 5;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  USER_STORAGE_LIMIT_MB?: number = 100;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    // Always throw error for missing JWT_SECRET
    const hasJwtSecretError = errors.some(error => 
      error.property === 'JWT_SECRET' && error.constraints?.isNotEmpty
    );
    
    if (hasJwtSecretError) {
      throw new Error('CRITICAL: JWT_SECRET must be set in environment variables. Application cannot start without it.');
    }
    
    // For other errors, warn in development but throw in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errors.toString());
    } else {
      console.warn('⚠️  환경변수 검증 경고 (개발 모드):', errors.toString());
    }
  }
  
  return validatedConfig;
}