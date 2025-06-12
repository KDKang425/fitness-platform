import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken } from './entities/push-token.entity';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private isInitialized = false;

  constructor(
    @InjectRepository(PushToken)
    private pushTokenRepository: Repository<PushToken>,
    private configService: ConfigService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const serviceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT');
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
        this.isInitialized = true;
        this.logger.log('Firebase Admin SDK initialized');
      } else {
        this.logger.warn('Firebase service account not configured');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  async registerToken(userId: number, token: string, platform: 'ios' | 'android' | 'web', deviceId?: string) {
    try {
      const existingToken = await this.pushTokenRepository.findOne({
        where: { userId, token },
      });

      if (existingToken) {
        existingToken.isActive = true;
        existingToken.updatedAt = new Date();
        return await this.pushTokenRepository.save(existingToken);
      }

      const pushToken = this.pushTokenRepository.create({
        userId,
        token,
        platform,
        deviceId,
      });

      return await this.pushTokenRepository.save(pushToken);
    } catch (error) {
      this.logger.error(`Failed to register push token for user ${userId}`, error);
      throw error;
    }
  }

  async unregisterToken(userId: number, token: string) {
    try {
      await this.pushTokenRepository.update(
        { userId, token },
        { isActive: false }
      );
    } catch (error) {
      this.logger.error(`Failed to unregister push token for user ${userId}`, error);
      throw error;
    }
  }

  async sendToUser(userId: number, notification: NotificationPayload) {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized, skipping notification');
      return;
    }

    try {
      const tokens = await this.pushTokenRepository.find({
        where: { userId, isActive: true },
      });

      if (tokens.length === 0) {
        this.logger.debug(`No active tokens found for user ${userId}`);
        return;
      }

      const messages = tokens.map(token => ({
        token: token.token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            clickAction: 'OPEN_APP',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }));

      const response = await admin.messaging().sendEach(messages);
      
      // Handle failed tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          this.logger.error(`Failed to send to token ${tokens[idx].token}:`, resp.error);
          // Mark invalid tokens as inactive
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
            this.unregisterToken(userId, tokens[idx].token);
          }
        }
      });

      this.logger.log(`Sent notification to user ${userId}: ${response.successCount}/${tokens.length} successful`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}`, error);
    }
  }

  async sendToMultipleUsers(userIds: number[], notification: NotificationPayload) {
    const promises = userIds.map(userId => this.sendToUser(userId, notification));
    await Promise.allSettled(promises);
  }

  // Social feature notifications
  async notifyNewFollower(followedUserId: number, followerName: string) {
    await this.sendToUser(followedUserId, {
      title: '새로운 팔로워',
      body: `${followerName}님이 회원님을 팔로우하기 시작했습니다.`,
      data: { type: 'new_follower' },
    });
  }

  async notifyPostLike(postOwnerId: number, likerName: string) {
    await this.sendToUser(postOwnerId, {
      title: '게시물 좋아요',
      body: `${likerName}님이 회원님의 게시물을 좋아합니다.`,
      data: { type: 'post_like' },
    });
  }

  async notifyFriendRequest(targetUserId: number, requesterName: string) {
    await this.sendToUser(targetUserId, {
      title: '친구 요청',
      body: `${requesterName}님이 친구 요청을 보냈습니다.`,
      data: { type: 'friend_request' },
    });
  }

  async notifyWorkoutReminder(userId: number, routineName: string) {
    await this.sendToUser(userId, {
      title: '운동 시간입니다! 💪',
      body: `오늘의 ${routineName} 운동을 시작해보세요.`,
      data: { type: 'workout_reminder' },
    });
  }

  async notifyPersonalRecord(userId: number, exerciseName: string, newRecord: string) {
    await this.sendToUser(userId, {
      title: '🎉 새로운 개인 기록!',
      body: `${exerciseName}에서 ${newRecord}을(를) 달성했습니다!`,
      data: { type: 'personal_record' },
    });
  }
}