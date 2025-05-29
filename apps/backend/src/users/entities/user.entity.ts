import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { Routine } from 'src/routines/entities/routine.entity';
import { WorkoutSession } from 'src/workouts/entities/workout-session.entity';
import { Post } from 'src/posts/entities/post.entity';
import { Like } from 'src/posts/entities/like.entity';
import { Follow } from 'src/users/entities/follow.entity';
import { BodyRecord } from 'src/body-records/entities/body-record.entity';
import { RoutineSubscription } from '../../routine-subscriptions/entities/routine-subscription.entity';
import { PersonalRecord } from '../../personal-records/entities/personal-record.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { UserProgram } from '../../programs/entities/user-program.entity';
import { FriendRequest } from './friend-request.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { PostComment } from '../../posts/entities/post-comment.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
@Unique('users_email_key', ['email'])
@Unique('users_nickname_key', ['nickname'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 50 })
  nickname: string;

  @Column({ nullable: true, length: 255 })
  profileImageUrl?: string;

  @Column({ nullable: true })
  height?: number;

  @Column({ nullable: true })
  initialWeight?: number;

  @Column({ nullable: true })
  benchPress1RM?: number;

  @Column({ nullable: true })
  squat1RM?: number;

  @Column({ nullable: true })
  deadlift1RM?: number;

  @Column({ nullable: true })
  overheadPress1RM?: number;

  @Column({ default: false })
  hasCompletedInitialSetup: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  emailVerificationExpiry?: Date;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpiry?: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  fcmToken?: string;

  @Column({ default: true })
  notificationsEnabled: boolean;

  @Column({ default: 'kg', length: 3 })
  preferredUnit?: 'kg' | 'lbs';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Routine, (routine) => routine.creator)
  routines: Routine[];

  @OneToMany(() => WorkoutSession, (session) => session.user)
  workoutSessions: WorkoutSession[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => BodyRecord, (record) => record.user)
  bodyRecords: BodyRecord[];

  @OneToMany(() => RoutineSubscription, (s) => s.user)
  routineSubscriptions: RoutineSubscription[];

  @OneToMany(() => PersonalRecord, (pr) => pr.user)
  personalRecords: PersonalRecord[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => UserProgram, (program) => program.user)
  userPrograms: UserProgram[];

  @OneToMany(() => FriendRequest, (request) => request.requester)
  sentFriendRequests: FriendRequest[];

  @OneToMany(() => FriendRequest, (request) => request.recipient)
  receivedFriendRequests: FriendRequest[];

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => PostComment, c => c.author)
  postComments: PostComment[];
}
