import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { User } from '../users/entities/user.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: Repository<Post>;
  let likeRepo: Repository<Like>;
  let userRepo: Repository<User>;
  let dataSource: DataSource;

  const mockDataSource = {
    transaction: jest.fn((cb) => cb({
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      delete: jest.fn(),
    })),
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
              innerJoin: jest.fn().mockReturnThis(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Like),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(WorkoutSession),
          useValue: {},
        },
        {
          provide: getRepositoryToken(PersonalRecord),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
    likeRepo = module.get<Repository<Like>>(getRepositoryToken(Like));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const createPostDto = {
        userId: 1,
        content: 'Test post',
        imageUrl: 'http://example.com/image.jpg',
      };

      const mockPost = {
        id: 1,
        ...createPostDto,
        user: { id: 1 },
        workoutSession: null,
      };

      jest.spyOn(postRepo, 'create').mockReturnValue(mockPost as any);
      jest.spyOn(postRepo, 'save').mockResolvedValue(mockPost as any);

      const result = await service.createPost(createPostDto);

      expect(postRepo.create).toHaveBeenCalledWith({
        user: { id: 1 },
        workoutSession: null,
        content: 'Test post',
        imageUrl: 'http://example.com/image.jpg',
      });
      expect(postRepo.save).toHaveBeenCalledWith(mockPost);
      expect(result).toEqual(mockPost);
    });

    it('should throw ConflictException when neither image nor content is provided', async () => {
      const createPostDto = {
        userId: 1,
        content: '',
        imageUrl: '',
      };

      await expect(service.createPost(createPostDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a post with isLiked when userId is provided', async () => {
      const mockPost = {
        id: 1,
        content: 'Test post',
        user: { id: 2 },
      };

      jest.spyOn(postRepo, 'findOne').mockResolvedValue(mockPost as any);
      jest.spyOn(likeRepo, 'find').mockResolvedValue([
        { post: { id: 1 } } as any,
      ]);

      const result = await service.findOne(1, 1);

      expect(result).toEqual({ ...mockPost, isLiked: true });
    });

    it('should throw NotFoundException when post is not found', async () => {
      jest.spyOn(postRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      const userId = 1;
      const postId = 1;
      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce({ id: postId }) // post exists
          .mockResolvedValueOnce(null), // no existing like
        create: jest.fn().mockReturnValue({ user: { id: userId }, post: { id: postId } }),
        save: jest.fn(),
        increment: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation((cb) => cb(mockManager));

      const result = await service.likePost(userId, postId);

      expect(mockManager.increment).toHaveBeenCalledWith(Post, { id: postId }, 'likesCount', 1);
      expect(result).toEqual({ success: true, message: '포스트에 좋아요를 했습니다.' });
    });

    it('should throw ConflictException when already liked', async () => {
      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce({ id: 1 }) // post exists
          .mockResolvedValueOnce({ id: 1 }), // existing like
      };

      (dataSource.transaction as jest.Mock).mockImplementation((cb) => cb(mockManager));

      await expect(service.likePost(1, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('deletePost', () => {
    it('should delete own post successfully', async () => {
      const mockPost = {
        id: 1,
        user: { id: 1 },
      };

      jest.spyOn(postRepo, 'findOne').mockResolvedValue(mockPost as any);
      jest.spyOn(postRepo, 'remove').mockResolvedValue(mockPost as any);

      const result = await service.deletePost(1, 1);

      expect(result).toEqual({ success: true, message: '포스트가 삭제되었습니다.' });
    });

    it('should throw ForbiddenException when trying to delete others post', async () => {
      const mockPost = {
        id: 1,
        user: { id: 2 },
      };

      jest.spyOn(postRepo, 'findOne').mockResolvedValue(mockPost as any);

      await expect(service.deletePost(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addIsLikedToPosts', () => {
    it('should add isLiked field to posts', async () => {
      const posts = [
        { id: 1, content: 'Post 1' },
        { id: 2, content: 'Post 2' },
      ];

      jest.spyOn(likeRepo, 'find').mockResolvedValue([
        { post: { id: 1 } } as any,
      ]);

      const result = await service['addIsLikedToPosts'](posts as any[], 1);

      expect(result).toEqual([
        { id: 1, content: 'Post 1', isLiked: true },
        { id: 2, content: 'Post 2', isLiked: false },
      ]);
    });

    it('should return all posts with isLiked false when no userId', async () => {
      const posts = [{ id: 1, content: 'Post 1' }];

      const result = await service['addIsLikedToPosts'](posts as any[], null as any);

      expect(result).toEqual([
        { id: 1, content: 'Post 1', isLiked: false },
      ]);
    });
  });
});
