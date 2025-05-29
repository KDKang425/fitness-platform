import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Like, User, WorkoutSession, PersonalRecord])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}