import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import * as redisStore from 'cache-manager-redis-store';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoutinesModule } from './routines/routines.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { BodyRecordsModule } from './body-records/body-records.module';
import { PostsModule } from './posts/posts.module';
import { ExercisesModule } from './exercises/exercises.module';
import { AuthModule } from './auth/auth.module';
import { StatsModule } from './stats/stats.module';
import { RoutineSubscriptionsModule } from './routine-subscriptions/routine-subscriptions.module';
import { PersonalRecordsModule } from './personal-records/personal-records.module';
import { UploadModule } from './common/modules/upload/upload.module';
import { EmailModule } from './email/email.module';
import { NotificationModule } from './notification/notification.module';
import { ExportModule } from './export/export.module';
import { AdminModule } from './admin/admin.module';
import { WorkoutTemplatesModule } from './workout-templates/workout-templates.module';
import { UserProgramsModule } from './programs/user-programs.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { BackupModule } from './backup/backup.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validate,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 임시로 true 설정 - 개발 환경에서만 사용
        logging: process.env.NODE_ENV === 'development',
        namingStrategy: new SnakeNamingStrategy(),
        extra: {
          max: 30, // Increased from 10 for better concurrency
          min: 5,  // Minimum pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000, // Connection timeout
          acquireTimeoutMillis: 30000,   // Max time to wait for connection
        },
      }),
      inject: [ConfigService],
    }),

    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host', 'localhost'),
        port: configService.get('redis.port', 6379),
        ttl: 600,
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host', 'localhost'),
          port: configService.get('redis.port', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    }),

    UsersModule,
    RoutinesModule,
    WorkoutsModule,
    BodyRecordsModule,
    PostsModule,
    ExercisesModule,
    AuthModule,
    StatsModule,
    RoutineSubscriptionsModule,
    PersonalRecordsModule,
    UploadModule,
    EmailModule,
    NotificationModule,
    ExportModule,
    AdminModule,
    WorkoutTemplatesModule,
    UserProgramsModule,
    BackupModule,
    RealtimeModule,
    PushNotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}