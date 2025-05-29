import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
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
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
        namingStrategy: new SnakeNamingStrategy(),
        extra: {
          max: 10, 
          idleTimeoutMillis: 30000, 
        },
      }),
      inject: [ConfigService],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}