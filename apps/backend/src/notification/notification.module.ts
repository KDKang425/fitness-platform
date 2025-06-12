import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationScheduler } from './notification.scheduler';
import { Notification } from './entities/notification.entity';
import { NotificationSetting } from './entities/notification-setting.entity';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationSetting, User, WorkoutSession]),
    ScheduleModule.forRoot(),
    forwardRef(() => UsersModule),
    EmailModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationScheduler],
  exports: [NotificationService],
})
export class NotificationModule {}