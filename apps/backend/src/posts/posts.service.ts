import { Injectable } from '@nestjs/common';
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

  /** 좋아요 등록 */
  async likePost(userId: number, postId: number) {
    const like = this.likeRepo.create({
      user: { id: userId } as any,
      post: { id: postId } as any,
    });
    return this.likeRepo.save(like);
  }
}
