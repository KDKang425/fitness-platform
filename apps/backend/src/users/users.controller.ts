import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Delete,
  Req,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthRequest } from '../common/interfaces/auth-request.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '사용자가 성공적으로 생성됨' })
  @ApiResponse({ status: 409, description: '이메일 또는 닉네임 중복' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '프로필 정보 반환' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthRequest) {
    return this.usersService.getProfile(req.user.userId);
  }

  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiResponse({ status: 200, description: '프로필이 성공적으로 수정됨' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @ApiOperation({ summary: '사용자 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: '사용자 검색' })
  @ApiResponse({ status: 200, description: '검색 결과 반환' })
  @Get()
  search(@Query('q') query?: string) {
    return this.usersService.searchUsers(query);
  }

  @ApiOperation({ summary: '계정 삭제' })
  @ApiResponse({ status: 200, description: '계정이 성공적으로 삭제됨' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('account')
  deleteAccount(@Req() req: AuthRequest) {
    return this.usersService.remove(req.user.userId);
  }

  @ApiOperation({ summary: '사용자 팔로우' })
  @ApiResponse({ status: 201, description: '팔로우 성공' })
  @ApiResponse({ status: 400, description: '자기 자신을 팔로우할 수 없음' })
  @ApiResponse({ status: 409, description: '이미 팔로우 중' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('follow/:targetId')
  async follow(
    @Req() req: AuthRequest,
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.usersService.followUser(req.user.userId, targetId);
  }

  @ApiOperation({ summary: '사용자 언팔로우' })
  @ApiResponse({ status: 200, description: '언팔로우 성공' })
  @ApiResponse({ status: 404, description: '팔로우 관계를 찾을 수 없음' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('follow/:targetId')
  async unfollow(
    @Req() req: AuthRequest,
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.usersService.unfollowUser(req.user.userId, targetId);
  }

  @ApiOperation({ summary: '팔로워 목록 조회' })
  @ApiResponse({ status: 200, description: '팔로워 목록 반환' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':userId/followers')
  async getFollowers(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.usersService.getFollowers(userId, page, limit);
  }

  @ApiOperation({ summary: '팔로잉 목록 조회' })
  @ApiResponse({ status: 200, description: '팔로잉 목록 반환' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':userId/following')
  async getFollowing(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.usersService.getFollowing(userId, page, limit);
  }

  @ApiOperation({ summary: '내 팔로워 목록' })
  @ApiResponse({ status: 200, description: '팔로워 목록 반환' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me/followers')
  async getMyFollowers(
    @Req() req: AuthRequest,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.usersService.getFollowers(req.user.userId, page, limit);
  }

  @ApiOperation({ summary: '내 팔로잉 목록' })
  @ApiResponse({ status: 200, description: '팔로잉 목록 반환' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me/following')
  async getMyFollowing(
    @Req() req: AuthRequest,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.usersService.getFollowing(req.user.userId, page, limit);
  }
}