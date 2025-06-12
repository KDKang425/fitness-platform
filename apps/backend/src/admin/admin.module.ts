import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { Post } from '../posts/entities/post.entity';
import { Routine } from '../routines/entities/routine.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WorkoutSession, Post, Routine]),
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}