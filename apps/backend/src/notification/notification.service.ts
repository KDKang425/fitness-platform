import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationSetting } from './entities/notification-setting.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationSetting)
    private settingRepo: Repository<NotificationSetting>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configService: ConfigService,
  ) {
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey && !admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      } catch (error) {
        console.warn('Firebase initialization failed:', error);
      }
    }
  }

  async createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    body: string,
    data?: any,
  ) {
    const notification = this.notificationRepo.create({
      user: { id: userId } as any,
      type,
      title,
      body,
      data,
    });

    const saved = await this.notificationRepo.save(notification);

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['fcmToken', 'notificationsEnabled'],
    });

    if (user?.fcmToken && user.notificationsEnabled) {
      await this.sendPushNotification(user.fcmToken, title, body, data);
    }

    return saved;
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: any,
  ) {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token: fcmToken,
      };

      await admin.messaging().send(message);
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  async getNotifications(userId: number, page = 1, limit = 20) {
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.user.id = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    const [notifications, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId: number, notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    await this.notificationRepo.save(notification);

    return notification;
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepo.update(
      { user: { id: userId }, read: false },
      { read: true },
    );

    return { success: true };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({
      where: { user: { id: userId }, read: false },
    });
  }

  async getNotificationSettings(userId: number) {
    let settings = await this.settingRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!settings) {
      settings = this.settingRepo.create({
        user: { id: userId } as any,
      });
      await this.settingRepo.save(settings);
    }

    return settings;
  }

  async updateNotificationSettings(userId: number, dto: any) {
    let settings = await this.settingRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!settings) {
      settings = this.settingRepo.create({
        user: { id: userId } as any,
      });
    }

    Object.assign(settings, dto);
    return this.settingRepo.save(settings);
  }

  async sendWorkoutReminder(userId: number, workoutName: string, time: string) {
    await this.createNotification(
      userId,
      NotificationType.WORKOUT_REMINDER,
      '운동 리마인더',
      `${time}에 예정된 ${workoutName} 운동 시간입니다!`,
      { workoutName, time },
    );
  }

  async sendFollowNotification(followerId: number, followingId: number) {
    const follower = await this.userRepo.findOne({
      where: { id: followerId },
      select: ['nickname'],
    });

    if (follower) {
      await this.createNotification(
        followingId,
        NotificationType.SOCIAL,
        '새로운 팔로워',
        `${follower.nickname}님이 회원님을 팔로우했습니다.`,
        { followerId },
      );
    }
  }

  async sendAchievementNotification(userId: number, achievement: string) {
    await this.createNotification(
      userId,
      NotificationType.ACHIEVEMENT,
      '새로운 성취!',
      achievement,
      { achievement },
    );
  }

  async create(user: User, type: NotificationType, data: Record<string, any>) {
    await this.notificationRepo.save({
      user,              
      type,
      title: '',
      body: '',
      data,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}