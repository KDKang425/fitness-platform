import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { NotificationSetting } from './entities/notification-setting.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';

@Injectable()
export class NotificationScheduler {
  constructor(
    private notificationService: NotificationService,
    @InjectRepository(NotificationSetting)
    private settingRepo: Repository<NotificationSetting>,
    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendWorkoutReminders() {
    const currentHour = new Date().getHours();
    const currentTime = `${currentHour}:00`;

    const settings = await this.settingRepo.find({
      where: { workoutReminders: true },
      relations: ['user'],
    });

    for (const setting of settings) {
      if (setting.workoutReminderTimes?.includes(currentTime)) {
        const lastSession = await this.sessionRepo.findOne({
          where: { user: { id: setting.user.id } },
          order: { date: 'DESC' },
        });

        const daysSinceLastWorkout = lastSession
          ? Math.floor(
              (new Date().getTime() - new Date(lastSession.date).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 999;

        if (daysSinceLastWorkout >= 1) {
          await this.notificationService.sendWorkoutReminder(
            setting.user.id,
            '오늘의 운동',
            currentTime,
          );
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkAchievements() {
    const users = await this.sessionRepo
      .createQueryBuilder('session')
      .select('session.user.id', 'userId')
      .addSelect('COUNT(session.id)', 'sessionCount')
      .groupBy('session.user.id')
      .getRawMany();

    for (const user of users) {
      if (user.sessionCount === 7) {
        await this.notificationService.sendAchievementNotification(
          user.userId,
          '일주일 연속 운동 달성! 🎉',
        );
      } else if (user.sessionCount === 30) {
        await this.notificationService.sendAchievementNotification(
          user.userId,
          '한 달 운동 목표 달성! 🏆',
        );
      } else if (user.sessionCount === 100) {
        await this.notificationService.sendAchievementNotification(
          user.userId,
          '100회 운동 달성! 💯',
        );
      }
    }
  }
}