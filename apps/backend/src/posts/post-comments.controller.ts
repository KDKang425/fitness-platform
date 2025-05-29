import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostCommentsService } from './post-comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('posts')
export class PostCommentsController {
  constructor(private readonly svc: PostCommentsService) {}

  @Get(':postId/comments')
  list(@Param('postId', ParseIntPipe) postId: number) {
    return this.svc.list(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  add(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
    @Req() req,
  ) {
    return this.svc.add(req.user.userId, postId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('comments/:commentId')
  edit(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: UpdateCommentDto,
    @Req() req,
  ) {
    return this.svc.update(req.user.userId, commentId, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  remove(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req,
  ) {
    return this.svc.remove(req.user.userId, commentId);
  }
}
