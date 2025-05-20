import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: true,
    }),

        UsersModule,

        RoutinesModule,

        WorkoutsModule,

        BodyRecordsModule,

        PostsModule,

        ExercisesModule,

        AuthModule,

        StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
