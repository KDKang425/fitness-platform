import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  createPost(dto: CreatePostDto) {
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

  findOne(id: number) {
    return this.postRepo.findOne({ where: { id } });
  }

  findAll() {
    return this.postRepo.find();
  }

  async likePost(userId: number, postId: number) {
    const existingLike = await this.likeRepo.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });
    
    if (existingLike) {
      throw new ConflictException('Already liked this post');
    }

    const like = this.likeRepo.create({
      user: { id: userId } as any,
      post: { id: postId } as any,
    });
    
    const savedLike = await this.likeRepo.save(like);
    
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
    
    return savedLike;
  }

  async unlikePost(userId: number, postId: number) {
    const result = await this.likeRepo.delete({
      user: { id: userId },
      post: { id: postId },
    });
    
    if (result.affected === 0) {
      throw new NotFoundException('Like not found');
    }
    
    await this.postRepo.decrement({ id: postId }, 'likesCount', 1);
    
    return { success: true };
  }
}

