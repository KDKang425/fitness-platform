import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Unique, OneToMany,
} from 'typeorm';
import { Routine } from 'src/routines/entities/routine.entity';
import { WorkoutSession } from 'src/workouts/entities/workout-session.entity';
import { Post } from 'src/posts/entities/post.entity';
import { Like } from 'src/posts/entities/like.entity';
import { Follow } from 'src/users/entities/follow.entity';
import { BodyRecord } from 'src/body-records/entities/body-record.entity';
import { RoutineSubscription } from '../../routine-subscriptions/entities/routine-subscription.entity';
import { PersonalRecord } from '../../personal-records/entities/personal-record.entity';

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
}
