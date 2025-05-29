import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
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
      throw new NotFoundException(`Post with ID ${id} not found`);
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

  async likePost(userId: number, postId: number) {
    return this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, { where: { id: postId } });
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const existingLike = await manager.findOne(Like, {
        where: { user: { id: userId }, post: { id: postId } },
      });
      
      if (existingLike) {
        throw new ConflictException('Already liked this post');
      }

      const like = manager.create(Like, {
        user: { id: userId } as any,
        post: { id: postId } as any,
      });
      
      await manager.save(like);
      
      await manager.increment(Post, { id: postId }, 'likesCount', 1);
      
      return { success: true, message: 'Post liked successfully' };
    });
  }

  async unlikePost(userId: number, postId: number) {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.delete(Like, {
        user: { id: userId },
        post: { id: postId },
      });
      
      if (result.affected === 0) {
        throw new NotFoundException('Like not found');
      }
      
      await manager.decrement(Post, { id: postId }, 'likesCount', 1);
      
      return { success: true, message: 'Post unliked successfully' };
    });
  }

  async deletePost(userId: number, postId: number) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user.id !== userId) {
      throw new ForbiddenException('포스트를 삭제할 권한이 없습니다.');
    }

    await this.postRepo.remove(post);
    return { success: true, message: 'Post deleted successfully' };
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

    if (onlyFollowing) {
      query.innerJoin('user.followers', 'follow', 'follow.follower.id = :userId', { userId });
    }

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
  }
}