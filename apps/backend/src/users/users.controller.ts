import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Delete, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    return req.user; // { userId, email }
    }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Post('follow/:targetId')
  @UseGuards(JwtAuthGuard)
  async follow(
    @Req() req: any,
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.usersService.followUser(req.user.userId, targetId);
  }

  @Delete('follow/:targetId')
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @Req() req: any,
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.usersService.unfollowUser(req.user.userId, targetId);
  }

  @Get('followers/:userId?')
  @UseGuards(JwtAuthGuard)
  async getFollowers(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId?: number,
  ) {
    const targetUserId = userId || req.user.userId;
    return this.usersService.getFollowers(targetUserId);
  }

  @Get('following/:userId?')
  @UseGuards(JwtAuthGuard)
  async getFollowing(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId?: number,
  ) {
    const targetUserId = userId || req.user.userId;
    return this.usersService.getFollowing(targetUserId);
  }
}
