import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { User } from '../users/entities/user.entity';
import { Follow } from '../users/entities/follow.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

export interface Competition {
  id: string;
  creatorId: number;
  type: 'volume' | 'sets' | 'time';
  targetValue: number;
  participants: number[];
  standings: Record<number, number>;
  winner?: number;
  createdAt: Date;
}

export interface LiveSession {
  sessionId: number;
  startTime: Date;
}

@Injectable()
export class RealtimeService {
  private competitions = new Map<string, Competition>();
  private liveUsers = new Map<number, LiveSession>();
  private onlineUsers = new Set<number>();

  constructor(
    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    private notificationService: NotificationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async handleUserConnect(userId: number, socketId: string) {
    this.onlineUsers.add(userId);
    await this.cacheManager.set(`user:socket:${userId}`, socketId, 86400000);
  }

  async handleUserDisconnect(userId: number) {
    this.onlineUsers.delete(userId);
    this.liveUsers.delete(userId);
    await this.cacheManager.del(`user:socket:${userId}`);
  }

  async getFriendIds(userId: number): Promise<number[]> {
    const friends = await this.followRepo
      .createQueryBuilder('f1')
      .innerJoin('follows', 'f2', 'f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id')
      .where('f1.follower_id = :userId', { userId })
      .select('f1.following_id', 'friendId')
      .getRawMany();

    return friends.map(f => f.friendId).filter(id => this.onlineUsers.has(id));
  }

  async createCompetition(
    creatorId: number,
    type: 'volume' | 'sets' | 'time',
    targetValue: number,
    participantIds: number[]
  ): Promise<Competition> {
    const id = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const competition: Competition = {
      id,
      creatorId,
      type,
      targetValue,
      participants: [creatorId, ...participantIds],
      standings: {},
      createdAt: new Date(),
    };

    competition.participants.forEach(p => {
      competition.standings[p] = 0;
    });

    this.competitions.set(id, competition);
    
    setTimeout(() => {
      this.competitions.delete(id);
    }, 24 * 60 * 60 * 1000);

    return competition;
  }

  async getCompetitionParticipants(competitionId: string) {
    const competition = this.competitions.get(competitionId);
    if (!competition) return [];

    const users = await this.userRepo.findByIds(competition.participants);
    
    return users.map(user => ({
      id: user.id,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      progress: competition.standings[user.id] || 0,
      isOnline: this.onlineUsers.has(user.id),
    }));
  }

  async updateCompetitions(userId: number, stats: any): Promise<Competition[]> {
    const updatedCompetitions: Competition[] = [];

    for (const [id, competition] of this.competitions) {
      if (!competition.participants.includes(userId)) continue;

      let progress = 0;
      switch (competition.type) {
        case 'volume':
          progress = stats.totalVolume || 0;
          break;
        case 'sets':
          progress = stats.setCount || 0;
          break;
        case 'time':
          progress = stats.duration || 0;
          break;
      }

      competition.standings[userId] = progress;

      if (progress >= competition.targetValue && !competition.winner) {
        competition.winner = userId;
        
        for (const participantId of competition.participants) {
          if (participantId !== userId) {
            await this.notificationService.createNotification(
              participantId,
              NotificationType.SOCIAL,
              '경쟁 종료',
              '친구가 운동 경쟁에서 승리했습니다!',
              { competitionId: id, winnerId: userId }
            );
          }
        }
      }

      updatedCompetitions.push(competition);
    }

    return updatedCompetitions;
  }

  async setUserLive(userId: number, sessionId: number) {
    this.liveUsers.set(userId, {
      sessionId,
      startTime: new Date(),
    });
  }

  async setUserOffline(userId: number) {
    this.liveUsers.delete(userId);
  }

  async getUserLiveSession(userId: number): Promise<LiveSession | null> {
    return this.liveUsers.get(userId) || null;
  }

  async getOnlineFriends(userId: number) {
    const friendIds = await this.getFriendIds(userId);
    const onlineFriends = friendIds.filter(id => this.onlineUsers.has(id));

    const users = await this.userRepo.findByIds(onlineFriends);
    
    return users.map(user => ({
      id: user.id,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      isLive: this.liveUsers.has(user.id),
      liveSessionId: this.liveUsers.get(user.id)?.sessionId,
    }));
  }
}