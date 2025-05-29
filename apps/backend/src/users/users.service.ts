import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    dto.password = await bcrypt.hash(dto.password, salt);

    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async findOne(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findAll() {
    return this.userRepo.find();
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID=${id} not found`);
    }
    return this.userRepo.remove(user);
  }

  async followUser(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const existingFollow = await this.followRepo.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });
    
    if (existingFollow) {
      throw new ConflictException('Already following this user');
    }

    const follow = this.followRepo.create({
      follower: { id: followerId } as any,
      following: { id: followingId } as any,
    });
    return this.followRepo.save(follow);
  }

  async unfollowUser(followerId: number, followingId: number) {
    const result = await this.followRepo.delete({
      follower: { id: followerId },
      following: { id: followingId },
    });
    
    if (result.affected === 0) {
      throw new NotFoundException('Follow relationship not found');
    }
    
    return { success: true };
  }

  async getFollowers(userId: number) {
    const followers = await this.followRepo.find({
      where: { following: { id: userId } },
      relations: ['follower'],
      select: {
        id: true,
        createdAt: true,
        follower: {
          id: true,
          nickname: true,
          profileImageUrl: true,
        },
      },
    });
    
    return followers.map(f => ({
      id: f.follower.id,
      nickname: f.follower.nickname,
      profileImageUrl: f.follower.profileImageUrl,
      followedAt: f.createdAt,
    }));
  }

  async getFollowing(userId: number) {
    const following = await this.followRepo.find({
      where: { follower: { id: userId } },
      relations: ['following'],
      select: {
        id: true,
        createdAt: true,
        following: {
          id: true,
          nickname: true,
          profileImageUrl: true,
        },
      },
    });
    
    return following.map(f => ({
      id: f.following.id,
      nickname: f.following.nickname,
      profileImageUrl: f.following.profileImageUrl,
      followedAt: f.createdAt,
    }));
  }
}