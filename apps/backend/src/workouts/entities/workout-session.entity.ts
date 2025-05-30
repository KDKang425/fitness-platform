import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Routine } from 'src/routines/entities/routine.entity';
import { WorkoutSet } from 'src/workouts/entities/workout-set.entity';
import { Post } from 'src/posts/entities/post.entity';

@Entity('workout_sessions')
@Index(['user', 'date'])
@Index(['user', 'startTime'])
export class WorkoutSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date | null;

  @Column({ type: 'int', nullable: true })
  totalTime?: number | null;

  @Column({ type: 'int', default: 0 })
  totalVolume: number;

  @Column({ type: 'jsonb', nullable: true })
  pausedIntervals?: { pausedAt: Date; resumedAt?: Date }[];

  @Column({ type: 'int', default: 0 })
  totalPausedTime: number;

  @ManyToOne(() => User, (user) => user.workoutSessions, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  user: User;

  @ManyToOne(() => Routine, (routine) => routine.workoutSessions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  routine?: Routine | null;

  @OneToMany(() => WorkoutSet, (set) => set.workoutSession, {
    cascade: true,
  })
  workoutSets: WorkoutSet[];

  @OneToMany(() => Post, (post) => post.workoutSession)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}