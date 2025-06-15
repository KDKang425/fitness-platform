import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Post } from '../src/posts/entities/post.entity';
import * as bcrypt from 'bcryptjs';

describe('Posts API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));
    
    await app.init();
    
    dataSource = app.get(DataSource);
    
    // Create test user
    const userRepo = dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    testUser = await userRepo.save({
      email: 'test@example.com',
      password: hashedPassword,
      nickname: 'testuser',
      height: 175,
      initialWeight: 70,
      hasCompletedInitialSetup: true,
      isVerified: true,
    });

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });
    
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Clean up
    await dataSource.getRepository(Post).delete({});
    await dataSource.getRepository(User).delete({});
    await app.close();
  });

  describe('/posts (POST)', () => {
    it('should create a new post', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test post content',
          imageUrl: 'http://example.com/image.jpg',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe('Test post content');
          expect(res.body.imageUrl).toBe('http://example.com/image.jpg');
        });
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({
          content: 'Test post content',
        })
        .expect(401);
    });

    it('should fail without content or image', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('/posts (GET)', () => {
    let postId: number;

    beforeEach(async () => {
      const postRepo = dataSource.getRepository(Post);
      const post = await postRepo.save({
        user: testUser,
        content: 'Test post for listing',
        imageUrl: 'http://example.com/test.jpg',
        likesCount: 5,
      });
      postId = post.id;
    });

    it('should get all posts', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('posts');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.posts)).toBe(true);
          expect(res.body.posts[0]).toHaveProperty('isLiked', false);
        });
    });

    it('should get posts with isLiked when authenticated', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.posts[0]).toHaveProperty('isLiked');
        });
    });

    it('should get single post', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(postId);
          expect(res.body.content).toBe('Test post for listing');
          expect(res.body).toHaveProperty('isLiked', false);
        });
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .get('/posts/99999')
        .expect(404);
    });
  });

  describe('/posts/:id/likes (POST/DELETE)', () => {
    let postId: number;

    beforeEach(async () => {
      const postRepo = dataSource.getRepository(Post);
      const post = await postRepo.save({
        user: testUser,
        content: 'Test post for likes',
        likesCount: 0,
      });
      postId = post.id;
    });

    it('should like a post', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('좋아요');
        });
    });

    it('should fail to like twice', async () => {
      // First like
      await request(app.getHttpServer())
        .post(`/posts/${postId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Second like should fail
      return request(app.getHttpServer())
        .post(`/posts/${postId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });

    it('should unlike a post', async () => {
      // Like first
      await request(app.getHttpServer())
        .post(`/posts/${postId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Then unlike
      return request(app.getHttpServer())
        .delete(`/posts/${postId}/likes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('취소');
        });
    });
  });

  describe('/posts/feed (GET)', () => {
    it('should get personalized feed', () => {
      return request(app.getHttpServer())
        .get('/posts/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('posts');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.posts)).toBe(true);
        });
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .get('/posts/feed')
        .expect(401);
    });
  });

  describe('/posts/:id (DELETE)', () => {
    let postId: number;

    beforeEach(async () => {
      const postRepo = dataSource.getRepository(Post);
      const post = await postRepo.save({
        user: testUser,
        content: 'Test post to delete',
      });
      postId = post.id;
    });

    it('should delete own post', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('삭제');
        });
    });

    it('should fail to delete non-existent post', () => {
      return request(app.getHttpServer())
        .delete('/posts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});