import { Controller, Get, Post as PostMethod, Body, Param, ParseIntPipe, UseGuards, Req, Delete } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @PostMethod()
  create(@Body() dto: CreatePostDto) {
    return this.postsService.createPost(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @PostMethod(':id/likes')
  @UseGuards(JwtAuthGuard)
  async likePost(
    @Req() req: any,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.likePost(req.user.userId, postId);
  }

  @Delete(':id/likes')
  @UseGuards(JwtAuthGuard)
  async unlikePost(
    @Req() req: any,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.unlikePost(req.user.userId, postId);
  }
}