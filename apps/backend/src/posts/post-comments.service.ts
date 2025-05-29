import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostComment } from './entities/post-comment.entity';
import { Post } from './entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class PostCommentsService {
  constructor(
    @InjectRepository(PostComment)
    private readonly commentRepo: Repository<PostComment>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async add(userId: number, postId: number, dto: CreateCommentDto) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');
    const parent =
      dto.parentId &&
      (await this.commentRepo.findOne({ where: { id: dto.parentId } }));
    const comment = this.commentRepo.create({
      content: dto.content,
      author: { id: userId } as any,
      post,
      parent: parent || null,
    });
    return this.commentRepo.save(comment);
  }

  async list(postId: number) {
    return this.commentRepo.find({
      where: { post: { id: postId } },
      relations: ['author', 'children'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(userId: number, commentId: number, content: string) {
    const c = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['author'],
    });
    if (!c) throw new NotFoundException();
    if (c.author.id !== userId) throw new ForbiddenException();
    c.content = content;
    return this.commentRepo.save(c);
  }

  async remove(userId: number, commentId: number) {
    const c = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['author'],
    });
    if (!c) throw new NotFoundException();
    if (c.author.id !== userId) throw new ForbiddenException();
    await this.commentRepo.remove(c);
    return { success: true };
  }
}
