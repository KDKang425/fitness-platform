import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Repository<User>;
  let followRepo: Repository<Follow>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockFollowRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: mockFollowRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    followRepo = module.get<Repository<Follow>>(getRepositoryToken(Follow));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should hash password on user creation', async () => {
      const dto: CreateUserDto = {
        email: 'test@test.com',
        password: 'password123',
        nickname: 'testuser',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(dto);
      mockUserRepository.save.mockResolvedValue({
        ...dto,
        id: 1,
        password: 'hashedPassword',
      });

      const user = await service.createUser(dto);
      
      expect(user.password).toBeUndefined();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      const dto: CreateUserDto = {
        email: 'existing@test.com',
        password: 'password123',
        nickname: 'newuser',
      };

      mockUserRepository.findOne.mockResolvedValueOnce({ id: 1, email: 'existing@test.com' });

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if nickname exists', async () => {
      const dto: CreateUserDto = {
        email: 'new@test.com',
        password: 'password123',
        nickname: 'existing',
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1, nickname: 'existing' });

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('followUser', () => {
    it('should create follow relationship', async () => {
      const followerId = 1;
      const followingId = 2;

      mockUserRepository.findOne.mockResolvedValue({ id: followingId });
      mockFollowRepository.findOne.mockResolvedValue(null);
      mockFollowRepository.create.mockReturnValue({
        follower: { id: followerId },
        following: { id: followingId },
      });
      mockFollowRepository.save.mockResolvedValue({});

      const result = await service.followUser(followerId, followingId);
      
      expect(result.success).toBe(true);
      expect(mockFollowRepository.save).toHaveBeenCalled();
    });

    it('should throw error when following self', async () => {
      await expect(service.followUser(1, 1)).rejects.toThrow('자기 자신을 팔로우할 수 없습니다.');
    });
  });
});