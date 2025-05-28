import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';

describe('Workout flow', () => {
  let app: INestApplication;
  let token: string;
  let sessionId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'e2e@test.com', password: '1234', nickname: 'e2e' });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e@test.com', password: '1234' });
    token = res.body.access_token;
  });

  it('creates session, set, finish', async () => {
    const s = await request(app.getHttpServer())
      .post('/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    sessionId = s.body.id;

    await request(app.getHttpServer())
      .post(`/workouts/${sessionId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({ exercise_id: 1, reps: 5, weight: 100 });

    await request(app.getHttpServer())
      .post(`/workouts/${sessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
  });

  afterAll(async () => {
    await app.close();
  });
});