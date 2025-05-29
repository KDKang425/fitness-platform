import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(PersonalRecord)
    private readonly prRepo: Repository<PersonalRecord>,
    private readonly dataSource: DataSource,
  ) {}

  async createPost(dto: CreatePostDto) {
    if (!dto.imageUrl && !dto.content) {
      throw new ConflictException('이미지 또는 내용 중 하나는 필수입니다.');
    }

    const post = this.postRepo.create({
      user: { id: dto.userId } as any,
      workoutSession: dto.workoutSessionId
        ? ({ id: dto.workoutSessionId } as any)
        : null,
      content: dto.content,
      imageUrl: dto.imageUrl,
    });

    return this.postRepo.save(post);
  }

  async findOne(id: number) {
    const post = await this.postRepo.findOne({ 
      where: { id },
      relations: ['user', 'workoutSession'],
    });
    
    if (!post) {
      throw new NotFoundException(`ID ${id}인 포스트를 찾을 수 없습니다.`);
    }
    
    return post;
  }

  async findAll(page = 1, limit = 20, sort = 'recent') {
    const query = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .select([
        'post.id',
        'post.imageUrl',
        'post.content',
        'post.likesCount',
        'post.createdAt',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ]);

    if (sort === 'popular') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      query.where('post.createdAt >= :date', { date: oneWeekAgo })
        .orderBy('post.likesCount', 'DESC')
        .addOrderBy('post.createdAt', 'DESC');
    } else {
      query.orderBy('post.createdAt', 'DESC');
    }

    const skip = (page - 1) * limit;
    const [posts, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPersonalizedFeed(
    userId: number, 
    page = 1, 
    limit = 20,
    algorithm: 'default' | 'engagement' | 'similarity' = 'default'
  ) {
    const skip = (page - 1) * limit;

    switch (algorithm) {
      case 'engagement':
        return this.getEngagementBasedFeed(userId, skip, limit);
      case 'similarity':
        return this.getSimilarityBasedFeed(userId, skip, limit);
      default:
        return this.getDefaultPersonalizedFeed(userId, skip, limit);
    }
  }

  private async getDefaultPersonalizedFeed(userId: number, skip: number, limit: number) {

    const followingPosts = await this.getFollowingPosts(userId, Math.floor(limit * 0.5));
    const similarUserPosts = await this.getSimilarUserPosts(userId, Math.floor(limit * 0.3));
    const popularPosts = await this.getPopularPosts(Math.ceil(limit * 0.2), userId);

    const seenIds = new Set<number>();
    const combinedPosts: Post[] = [];

    for (const post of [...followingPosts, ...similarUserPosts, ...popularPosts]) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        combinedPosts.push(post);
      }
    }

    const scoredPosts = await this.scoreAndSortPosts(combinedPosts, userId);
    const paginatedPosts = scoredPosts.slice(skip, skip + limit);

    const total = await this.postRepo.count();

    return {
      posts: paginatedPosts,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      algorithm: 'default',
    };
  }

  private async getEngagementBasedFeed(userId: number, skip: number, limit: number) {
    const userLikePattern = await this.analyzeUserLikePattern(userId);
    
    const query = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoin('post.workoutSession', 'session')
      .leftJoin('session.workoutSets', 'sets')
      .leftJoin('sets.exercise', 'exercise')
      .where('post.user.id != :userId', { userId });

    if (userLikePattern.preferredExercises.length > 0) {
      query.andWhere('exercise.id IN (:...exercises)', { 
        exercises: userLikePattern.preferredExercises 
      });
    }

    const posts = await query
      .select([
        'post.id',
        'post.imageUrl',
        'post.content',
        'post.likesCount',
        'post.createdAt',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ])
      .orderBy('post.likesCount', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const total = await query.getCount();

    return {
      posts,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      algorithm: 'engagement',
    };
  }

  private async getSimilarityBasedFeed(userId: number, skip: number, limit: number) {
    const userProfile = await this.getUserStrengthProfile(userId);
    const similarUsers = await this.findSimilarUsers(userId, userProfile);

    const posts = await this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.user.id IN (:...userIds)', { 
        userIds: similarUsers.map(u => u.id) 
      })
      .select([
        'post.id',
        'post.imageUrl',
        'post.content',
        'post.likesCount',
        'post.createdAt',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ])
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const total = await this.postRepo.count({
      where: { user: { id: In(similarUsers.map(u => u.id)) } }
    });

    return {
      posts,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      algorithm: 'similarity',
    };
  }

  private async getFollowingPosts(userId: number, limit: number) {
    return this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .innerJoin('user.followers', 'follow', 'follow.follower.id = :userId', { userId })
      .select([
        'post.id',
        'post.imageUrl',
        'post.content',
        'post.likesCount',
        'post.createdAt',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ])
      .orderBy('post.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  private async getSimilarUserPosts(userId: number, limit: number) {
    const userExercises = await this.sessionRepo
      .createQueryBuilder('session')
      .leftJoin('session.workoutSets', 'sets')
      .leftJoin('sets.exercise', 'exercise')
      .where('session.user.id = :userId', { userId })
      .select('exercise.id', 'exerciseId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('exercise.id')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const exerciseIds = userExercises.map(e => e.exerciseId);

    if (exerciseIds.length === 0) {
      return [];
    }

    return this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoin('post.workoutSession', 'session')
      .leftJoin('session.workoutSets', 'sets')
      .leftJoin('sets.exercise', 'exercise')
      .where('exercise.id IN (:...exerciseIds)', { exerciseIds })
      .andWhere('post.user.id != :userId', { userId })
      .select([
        'post.id',
        'post.imageUrl',
        'post.content',
        'post.likesCount',
        'post.createdAt',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ])
      .orderBy('post.likesCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  private async getPopularPosts(limit: number, excludeUserId?: number) {
    const query = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.createdAt >= :date', { 
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
      });

    if (excludeUserId) {
      query.andWhere('post.user.id != :userId', { userId: excludeUserId });
    }

    return query
      .select([
        'post.id',
        'post.imageUrl',
        'post.content',
        'post.likesCount',
        'post.createdAt',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ])
      .orderBy('post.likesCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  private async scoreAndSortPosts(posts: any[], userId: number) {
    const scoredPosts = await Promise.all(posts.map(async (post) => {
      let score = 0;

      const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 30 - ageInHours);

      score += Math.min(40, post.likesCount * 2);

      const isFollowing = await this.isUserFollowing(userId, post.user.id);
      if (isFollowing) score += 30;

      return { ...post, score };
    }));

    return scoredPosts.sort((a, b) => b.score - a.score);
  }

  private async analyzeUserLikePattern(userId: number) {
    const likedPosts = await this.likeRepo.find({
      where: { user: { id: userId } },
      relations: ['post', 'post.workoutSession', 'post.workoutSession.workoutSets', 'post.workoutSession.workoutSets.exercise'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const exerciseFrequency = new Map<number, number>();
    
    for (const like of likedPosts) {
      if (like.post.workoutSession?.workoutSets) {
        for (const set of like.post.workoutSession.workoutSets) {
          const count = exerciseFrequency.get(set.exercise.id) || 0;
          exerciseFrequency.set(set.exercise.id, count + 1);
        }
      }
    }

    const preferredExercises = Array.from(exerciseFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([exerciseId]) => exerciseId);

    return { preferredExercises };
  }

  private async getUserStrengthProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['benchPress1RM', 'squat1RM', 'deadlift1RM'],
    });

    const prs = await this.prRepo.find({
      where: { user: { id: userId } },
      relations: ['exercise'],
      order: { estimated1RM: 'DESC' },
      take: 10,
    });

    return {
      mainLifts: {
        benchPress: user?.benchPress1RM || 0,
        squat: user?.squat1RM || 0,
        deadlift: user?.deadlift1RM || 0,
      },
      totalStrength: (user?.benchPress1RM || 0) + (user?.squat1RM || 0) + (user?.deadlift1RM || 0),
      topExercises: prs.map(pr => ({
        exerciseId: pr.exercise.id,
        estimated1RM: pr.estimated1RM,
      })),
    };
  }

  private async findSimilarUsers(userId: number, userProfile: any) {
    const tolerance = 0.2; 
    const minStrength = userProfile.totalStrength * (1 - tolerance);
    const maxStrength = userProfile.totalStrength * (1 + tolerance);

    return this.userRepo
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId })
      .andWhere(
        '(user.benchPress1RM + user.squat1RM + user.deadlift1RM) BETWEEN :min AND :max',
        { min: minStrength, max: maxStrength }
      )
      .select(['user.id'])
      .limit(50)
      .getMany();
  }

  private async isUserFollowing(userId: number, targetId: number): Promise<boolean> {
    const count = await this.dataSource
      .getRepository('Follow')
      .count({
        where: { 
          follower: { id: userId }, 
          following: { id: targetId } 
        }
      });
    return count > 0;
  }

  async likePost(userId: number, postId: number) {
    return this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, { where: { id: postId } });
      if (!post) {
        throw new NotFoundException('포스트를 찾을 수 없습니다.');
      }

      const existingLike = await manager.findOne(Like, {
        where: { user: { id: userId }, post: { id: postId } },
      });
      
      if (existingLike) {
        throw new ConflictException('이미 좋아요한 포스트입니다.');
      }

      const like = manager.create(Like, {
        user: { id: userId } as any,
        post: { id: postId } as any,
      });
      
      await manager.save(like);
      
      await manager.increment(Post, { id: postId }, 'likesCount', 1);
      
      return { success: true, message: '포스트에 좋아요를 했습니다.' };
    });
  }

  async unlikePost(userId: number, postId: number) {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.delete(Like, {
        user: { id: userId },
        post: { id: postId },
      });
      
      if (result.affected === 0) {
        throw new NotFoundException('좋아요를 찾을 수 없습니다.');
      }
      
      await manager.decrement(Post, { id: postId }, 'likesCount', 1);
      
      return { success: true, message: '좋아요를 취소했습니다.' };
    });
  }

  async deletePost(userId: number, postId: number) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('포스트를 찾을 수 없습니다.');
    }

    if (post.user.id !== userId) {
      throw new ForbiddenException('포스트를 삭제할 권한이 없습니다.');
    }

    await this.postRepo.remove(post);
    return { success: true, message: '포스트가 삭제되었습니다.' };
  }

  async getUserPosts(userId: number, page = 1, limit = 20) {
    const query = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.user.id = :userId', { userId })
      .select([
        'post.id',
        'post.imageUrl',
        'post.content',
        'post.likesCount',
        'post.createdAt',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ])
      .orderBy('post.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    const [posts, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFeedForUser(userId: number, onlyFollowing = false, page = 1, limit = 20) {
    if (onlyFollowing) {
      const query = this.postRepo.createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .innerJoin('user.followers', 'follow', 'follow.follower.id = :userId', { userId })
        .select([
          'post.id',
          'post.imageUrl',
          'post.content',
          'post.likesCount',
          'post.createdAt',
          'user.id',
          'user.nickname',
          'user.profileImageUrl',
        ]);

      const skip = (page - 1) * limit;
      const [posts, total] = await query
        .orderBy('post.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } else {
      return this.getPersonalizedFeed(userId, page, limit);
    }
  }
}