import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env.docker'),
});

import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Follow } from '../users/entities/follow.entity';
import { FriendRequest } from '../users/entities/friend-request.entity';
import { BodyRecord } from '../body-records/entities/body-record.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import { Post } from '../posts/entities/post.entity';
import { Like } from '../posts/entities/like.entity';
import { Routine } from '../routines/entities/routine.entity';
import { RoutineExercise } from '../routines/entities/routine-exercise.entity';
import { RoutineSubscription } from '../routine-subscriptions/entities/routine-subscription.entity';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { WorkoutTemplate } from '../workout-templates/entities/workout-template.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';
import { DailyStats } from '../stats/entities/daily-stats.entity';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationSetting } from '../notification/entities/notification-setting.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { PushToken } from '../push-notifications/entities/push-token.entity';
import { UserProgram } from '../programs/entities/user-program.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    User,
    Follow,
    FriendRequest,
    BodyRecord,
    Exercise,
    Post,
    Like,
    Routine,
    RoutineExercise,
    RoutineSubscription,
    WorkoutSession,
    WorkoutSet,
    WorkoutTemplate,
    PersonalRecord,
    DailyStats,
    Notification,
    NotificationSetting,
    RefreshToken,
    PushToken,
    UserProgram,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: true, // 임시로 true 설정 - 개발 환경에서만 사용
});
