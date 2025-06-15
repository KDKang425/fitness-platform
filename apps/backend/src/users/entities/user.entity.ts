import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { Routine } from '../../routines/entities/routine.entity';
import { WorkoutSession } from '../../workouts/entities/workout-session.entity';
import { Post } from '../../posts/entities/post.entity';
import { Like } from '../../posts/entities/like.entity';
import { Follow } from './follow.entity';
import { BodyRecord } from '../../body-records/entities/body-record.entity';
import { RoutineSubscription } from '../../routine-subscriptions/entities/routine-subscription.entity';
import { PersonalRecord } from '../../personal-records/entities/personal-record.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { UserProgram } from '../../programs/entities/user-program.entity';
import { FriendRequest } from './friend-request.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

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

  @Column({ nullable: true, length: 255, name: 'profile_image_url' })
  profileImageUrl?: string;

  @Column({ nullable: true })
  height?: number;

  @Column({ nullable: true, name: 'initial_weight' })
  initialWeight?: number;

  @Column({ nullable: true, name: 'bench_press_1rm' })
  benchPress1RM?: number;

  @Column({ nullable: true, name: 'squat_1rm' })
  squat1RM?: number;

  @Column({ nullable: true, name: 'deadlift_1rm' })
  deadlift1RM?: number;

  @Column({ nullable: true, name: 'overhead_press_1rm' })
  overheadPress1RM?: number;

  @Column({ default: false, name: 'has_completed_initial_setup' })
  hasCompletedInitialSetup: boolean;

  @Column({ default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ nullable: true, name: 'email_verification_token' })
  emailVerificationToken?: string;

  @Column({ nullable: true, name: 'email_verification_expiry' })
  emailVerificationExpiry?: Date;

  @Column({ nullable: true, name: 'password_reset_token' })
  passwordResetToken?: string;

  @Column({ nullable: true, name: 'password_reset_expiry' })
  passwordResetExpiry?: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true, name: 'fcm_token' })
  fcmToken?: string;

  @Column({ default: true, name: 'notifications_enabled' })
  notificationsEnabled: boolean;

  @Column({ default: 'kg', length: 3, name: 'preferred_unit' })
  preferredUnit?: 'kg' | 'lbs';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
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
}
