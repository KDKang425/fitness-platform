import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { User } from '../users/entities/user.entity';
import { Follow } from '../users/entities/follow.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutSession, User, Follow]),
    AuthModule,
    NotificationModule,
  ],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}