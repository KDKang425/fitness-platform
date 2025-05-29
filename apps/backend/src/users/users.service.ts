import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, DataSource } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { BodyRecord } from '../body-records/entities/body-record.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InitialProfileDto } from './dto/initial-profile.dto';
import * as bcrypt from 'bcryptjs';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const existingEmail = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('이메일이 이미 사용 중입니다.');
    }

    const existingNickname = await this.userRepo.findOne({
      where: { nickname: dto.nickname },
    });
    if (existingNickname) {
      throw new ConflictException('닉네임이 이미 사용 중입니다.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
    });

    try {
      const savedUser = await this.userRepo.save(user);
      const { password, ...result } = savedUser;
      return result as User;
    } catch (error: any) {
      if (error?.code === '23505') { 
        throw new ConflictException('이메일 또는 닉네임이 이미 사용 중입니다.');
      }
      throw error;
    }
  }

  async saveVerificationToken(userId: number, token: string) {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const cacheKey = `email-verify:${token}`;
    await this.cacheManager.set(cacheKey, userId, 86400000);

    await this.userRepo.update(userId, {
      emailVerificationExpiry: expiry,
    });
  }

  async verifyEmailToken(token: string) {
    const cacheKey = `email-verify:${token}`;
    const userId = await this.cacheManager.get<number>(cacheKey);

    if (!userId) {
      return null;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      return null;
    }

    await this.userRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpiry: undefined,
    });

    await this.cacheManager.del(cacheKey);
    return user;
  }

  async savePasswordResetToken(userId: number, token: string) {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    const cacheKey = `pwd-reset:${token}`;
    await this.cacheManager.set(cacheKey, userId, 3600000);

    await this.userRepo.update(userId, {
      passwordResetExpiry: expiry,
    });
  }

  async verifyPasswordResetToken(token: string) {
    const cacheKey = `pwd-reset:${token}`;
    const userId = await this.cacheManager.get<number>(cacheKey);

    if (!userId) {
      return null;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return null;
    }

    return user;
  }

  async updatePassword(userId: number, newPassword: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.userRepo.update(userId, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpiry: undefined,
    });
  }

  async updateFcmToken(userId: number, fcmToken: string) {
    await this.userRepo.update(userId, { fcmToken });
  }

  async toggleNotifications(userId: number, enabled: boolean) {
    await this.userRepo.update(userId, { notificationsEnabled: enabled });
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'nickname', 'profileImageUrl', 'createdAt', 'hasCompletedInitialSetup', 'role', 'emailVerified'],
    });

    if (!user) {
      throw new NotFoundException(`ID ${id}인 사용자를 찾을 수 없습니다.`);
    }

    return user;
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'nickname', 'profileImageUrl', 'createdAt', 'height', 'initialWeight', 'benchPress1RM', 'squat1RM', 'deadlift1RM', 'hasCompletedInitialSetup', 'notificationsEnabled'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const [followerCount, followingCount] = await Promise.all([
      this.followRepo.count({ where: { following: { id: userId } } }),
      this.followRepo.count({ where: { follower: { id: userId } } }),
    ]);

    return {
      ...user,
      followerCount,
      followingCount,
    };
  }

  async setInitialProfile(userId: number, dto: InitialProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.height = dto.height;
    user.initialWeight = dto.weight;
    user.benchPress1RM = dto.benchPress1RM;
    user.squat1RM = dto.squat1RM;
    user.deadlift1RM = dto.deadlift1RM;
    user.overheadPress1RM = dto.overheadPress1RM;
    
    if (dto.profileImageUrl) {
      user.profileImageUrl = dto.profileImageUrl;
    }
    
    user.hasCompletedInitialSetup = true;

    const updated = await this.userRepo.save(user);
    
    const bodyRecordRepo = this.dataSource.getRepository(BodyRecord);
    await bodyRecordRepo.save({
      user: { id: userId },
      weight: dto.weight,
      date: new Date().toISOString().split('T')[0],
    });

    const { password, ...result } = updated;
    return result;
  }

  async updateProfile(userId: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (dto.nickname && dto.nickname !== user.nickname) {
      const existing = await this.userRepo.findOne({
        where: { nickname: dto.nickname },
      });
      if (existing) {
        throw new ConflictException('닉네임이 이미 사용 중입니다.');
      }
    }

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      dto.password = await bcrypt.hash(dto.password, salt);
    }

    Object.assign(user, dto);
    const updated = await this.userRepo.save(user);
    const { password, ...result } = updated;
    return result;
  }

  async searchUsers(query?: string, page = 1, limit = 20) {
    const qb = this.userRepo.createQueryBuilder('user')
      .select(['user.id', 'user.nickname', 'user.profileImageUrl']);

    if (query) {
      qb.where('user.nickname ILIKE :query', { query: `%${query}%` });
    }

    const skip = (page - 1) * limit;
    const [users, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ID ${id}인 사용자를 찾을 수 없습니다.`);
    }
    await this.userRepo.remove(user);
    return { success: true, message: '사용자가 성공적으로 삭제되었습니다.' };
  }

  async followUser(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    const targetUser = await this.userRepo.findOne({
      where: { id: followingId },
    });
    if (!targetUser) {
      throw new NotFoundException('팔로우할 사용자를 찾을 수 없습니다.');
    }

    const existingFollow = await this.followRepo.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });
    
    if (existingFollow) {
      throw new ConflictException('이미 팔로우 중입니다.');
    }

    const follow = this.followRepo.create({
      follower: { id: followerId } as any,
      following: { id: followingId } as any,
    });
    
    await this.followRepo.save(follow);
    return { success: true, message: '팔로우했습니다.' };
  }

  async unfollowUser(followerId: number, followingId: number) {
    const result = await this.followRepo.delete({
      follower: { id: followerId },
      following: { id: followingId },
    });
    
    if (result.affected === 0) {
      throw new NotFoundException('팔로우 관계를 찾을 수 없습니다.');
    }
    
    return { success: true, message: '언팔로우했습니다.' };
  }

  async getFriends(userId: number) {
    const mutualFollows = await this.followRepo
      .createQueryBuilder('f1')
      .innerJoin('follows', 'f2', 'f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id')
      .leftJoinAndSelect('f1.following', 'friend')
      .where('f1.follower_id = :userId', { userId })
      .select([
        'f1.id',
        'f1.createdAt',
        'friend.id',
        'friend.nickname',
        'friend.profileImageUrl',
      ])
      .getMany();

    return {
      friends: mutualFollows.map(f => ({
        id: f.following.id,
        nickname: f.following.nickname,
        profileImageUrl: f.following.profileImageUrl,
        friendsSince: f.createdAt,
      })),
      total: mutualFollows.length,
    };
  }

  async addFriend(userId: number, targetId: number) {
    if (userId === targetId) {
      throw new BadRequestException('자기 자신을 친구로 추가할 수 없습니다.');
    }

    const targetUser = await this.userRepo.findOne({
      where: { id: targetId },
    });
    if (!targetUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const existingFollow1 = await this.followRepo.findOne({
      where: { follower: { id: userId }, following: { id: targetId } },
    });
    
    const existingFollow2 = await this.followRepo.findOne({
      where: { follower: { id: targetId }, following: { id: userId } },
    });

    if (existingFollow1 && existingFollow2) {
      throw new ConflictException('이미 친구 관계입니다.');
    }

    if (!existingFollow1) {
      await this.followUser(userId, targetId);
    }
    if (!existingFollow2) {
      await this.followUser(targetId, userId);
    }
    
    return { success: true, message: '친구 추가가 완료되었습니다.' };
  }

  async getFollowers(userId: number, page = 1, limit = 20) {
    const query = this.followRepo.createQueryBuilder('follow')
      .leftJoinAndSelect('follow.follower', 'follower')
      .where('follow.following.id = :userId', { userId })
      .select([
        'follow.id',
        'follow.createdAt',
        'follower.id',
        'follower.nickname',
        'follower.profileImageUrl',
      ]);

    const skip = (page - 1) * limit;
    const [followers, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      followers: followers.map(f => ({
        id: f.follower.id,
        nickname: f.follower.nickname,
        profileImageUrl: f.follower.profileImageUrl,
        followedAt: f.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: number, page = 1, limit = 20) {
    const query = this.followRepo.createQueryBuilder('follow')
      .leftJoinAndSelect('follow.following', 'following')
      .where('follow.follower.id = :userId', { userId })
      .select([
        'follow.id',
        'follow.createdAt',
        'following.id',
        'following.nickname',
        'following.profileImageUrl',
      ]);

    const skip = (page - 1) * limit;
    const [following, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      following: following.map(f => ({
        id: f.following.id,
        nickname: f.following.nickname,
        profileImageUrl: f.following.profileImageUrl,
        followedAt: f.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const count = await this.followRepo.count({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });
    return count > 0;
  }

  async isAdmin(userId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['role'],
    });
    return user?.role === UserRole.ADMIN;
  }
}