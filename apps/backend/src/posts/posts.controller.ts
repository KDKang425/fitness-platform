import {
  Controller,
  Get,
  Post as PostMethod,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: '포스트 작성' })
  @ApiResponse({ status: 201, description: '포스트가 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '이미지 또는 내용 중 하나는 필수' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @PostMethod()
  create(@Req() req: AuthRequest, @Body() dto: CreatePostDto) {
    return this.postsService.createPost({ ...dto, userId: req.user.userId });
  }

  @ApiOperation({ summary: '포스트 상세 조회' })
  @ApiResponse({ status: 200, description: '포스트 정보 반환' })
  @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @ApiOperation({ summary: '포스트 목록 조회' })
  @ApiResponse({ status: 200, description: '포스트 목록 반환' })
  @Get()
  findAll(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('sort') sort: 'recent' | 'popular' = 'recent',
  ) {
    return this.postsService.findAll(page, limit, sort);
  }

  @ApiOperation({ summary: '피드 조회' })
  @ApiResponse({ status: 200, description: '개인화된 피드 반환' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('feed')
  getFeed(
    @Req() req: AuthRequest,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('filter') filter: 'all' | 'following' = 'all',
  ) {
    return this.postsService.getFeedForUser(
      req.user.userId,
      filter === 'following',
      page,
      limit,
    );
  }

  @ApiOperation({ summary: '포스트 좋아요' })
  @ApiResponse({ status: 201, description: '좋아요 성공' })
  @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 좋아요한 포스트' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @PostMethod(':id/likes')
  likePost(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.likePost(req.user.userId, postId);
  }

  @ApiOperation({ summary: '포스트 좋아요 취소' })
  @ApiResponse({ status: 200, description: '좋아요 취소 성공' })
  @ApiResponse({ status: 404, description: '좋아요를 찾을 수 없음' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id/likes')
  unlikePost(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.unlikePost(req.user.userId, postId);
  }

  @ApiOperation({ summary: '포스트 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 403, description: '수정 권한이 없음' })
  @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @Req() req: AuthRequest,
  ) {
    return this.postsService.update(req.user.userId, id, dto);
  }

  @ApiOperation({ summary: '내 포스트 삭제' })
  @ApiResponse({ status: 200, description: '포스트 삭제 성공' })
  @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
  @ApiResponse({ status: 403, description: '삭제 권한이 없음' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deletePost(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postsService.deletePost(req.user.userId, id);
  }

  @ApiOperation({ summary: '사용자의 포스트 목록' })
  @ApiResponse({ status: 200, description: '사용자의 포스트 목록 반환' })
  @Get('user/:userId')
  getUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.postsService.getUserPosts(userId, page, limit);
  }
}
