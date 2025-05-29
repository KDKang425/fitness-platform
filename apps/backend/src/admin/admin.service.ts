import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { Post } from '../posts/entities/post.entity';
import { Routine } from '../routines/entities/routine.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    @InjectRepository(Routine)
    private routineRepo: Repository<Routine>,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalSessions,
      totalPosts,
      totalRoutines,
    ] = await Promise.all([
      this.userRepo.count(),
      this.sessionRepo
        .createQueryBuilder('s')
        .select('COUNT(DISTINCT s.user)', 'count')
        .where('s.startTime >= :date', { date: thirtyDaysAgo })
        .getRawOne()
        .then(r => Number(r?.count || 0)),
      this.userRepo.count({
        where: { createdAt: Between(sevenDaysAgo, now) },
      }),
      this.sessionRepo.count(),
      this.postRepo.count(),
      this.routineRepo.count({ where: { isPublic: true } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      newUsers,
      totalSessions,
      totalPosts,
      totalRoutines,
    };
  }

  async getUserStats(page = 1, limit = 20, search?: string) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.workoutSessions', 'session')
      .leftJoin('user.posts', 'post')
      .leftJoin('user.followers', 'follower')
      .select([
        'user.id',
        'user.email',
        'user.nickname',
        'user.createdAt',
        'user.emailVerified',
        'user.role',
      ])
      .addSelect('COUNT(DISTINCT session.id)', 'sessionCount')
      .addSelect('COUNT(DISTINCT post.id)', 'postCount')
      .addSelect('COUNT(DISTINCT follower.id)', 'followerCount')
      .groupBy('user.id');

    if (search) {
      query.where(
        'user.email ILIKE :search OR user.nickname ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    const users = await query
      .orderBy('user.createdAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const total = await query.getCount();

    return {
      users: users.map(u => ({
        id: u.user_id,
        email: u.user_email,
        nickname: u.user_nickname,
        createdAt: u.user_created_at,
        emailVerified: u.user_email_verified,
        role: u.user_role,
        sessionCount: Number(u.sessionCount),
        postCount: Number(u.postCount),
        followerCount: Number(u.followerCount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGrowthStats(period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;
    let interval: string;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = 'day';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = 'day';
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        interval = 'month';
        break;
    }

    const userGrowth = await this.userRepo
      .createQueryBuilder('user')
      .select(`DATE_TRUNC('${interval}', user.createdAt)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= :startDate', { startDate })
      .groupBy(`DATE_TRUNC('${interval}', user.createdAt)`)
      .orderBy(`DATE_TRUNC('${interval}', user.createdAt)`, 'ASC')
      .getRawMany();

    const sessionGrowth = await this.sessionRepo
      .createQueryBuilder('session')
      .select(`DATE_TRUNC('${interval}', session.date)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('session.date >= :startDate', { startDate: startDate.toISOString().split('T')[0] })
      .groupBy(`DATE_TRUNC('${interval}', session.date)`)
      .orderBy(`DATE_TRUNC('${interval}', session.date)`, 'ASC')
      .getRawMany();

    return {
      userGrowth,
      sessionGrowth,
    };
  }

  async getEngagementStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dau = await this.sessionRepo
      .createQueryBuilder('s')
      .select('DATE(s.startTime)', 'date')
      .addSelect('COUNT(DISTINCT s.user)', 'activeUsers')
      .where('s.startTime >= :date', { date: thirtyDaysAgo })
      .groupBy('DATE(s.startTime)')
      .orderBy('DATE(s.startTime)', 'DESC')
      .limit(30)
      .getRawMany();

    const topRoutines = await this.routineRepo
      .createQueryBuilder('r')
      .leftJoin('r.subscribers', 'sub')
      .leftJoin('r.workoutSessions', 'session')
      .select(['r.id', 'r.name'])
      .addSelect('COUNT(DISTINCT sub.id)', 'subscriberCount')
      .addSelect('COUNT(DISTINCT session.id)', 'usageCount')
      .where('r.isPublic = true')
      .groupBy('r.id')
      .orderBy('COUNT(DISTINCT sub.id)', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      dailyActiveUsers: dau,
      topRoutines: topRoutines.map(r => ({
        id: r.r_id,
        name: r.r_name,
        subscriberCount: Number(r.subscriberCount),
        usageCount: Number(r.usageCount),
      })),
    };
  }

  async banUser(userId: number) {
    await this.userRepo.update(userId, { emailVerified: false });
    return { success: true, message: 'User has been banned' };
  }

  async unbanUser(userId: number) {
    await this.userRepo.update(userId, { emailVerified: true });
    return { success: true, message: 'User has been unbanned' };
  }

  async deleteContent(type: 'post' | 'routine', contentId: number) {
    if (type === 'post') {
      await this.postRepo.delete(contentId);
    } else {
      await this.routineRepo.delete(contentId);
    }
    return { success: true, message: `${type} has been deleted` };
  }
}