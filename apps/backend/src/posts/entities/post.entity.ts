import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { WorkoutSession } from 'src/workouts/entities/workout-session.entity';
import { PostComment } from './post-comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @ManyToOne(() => WorkoutSession, { onDelete: 'SET NULL', nullable: true })
  workoutSession: WorkoutSession | null;

  @Column({ nullable: true, length: 255 })
  imageUrl?: string;

  @Column({ nullable: true, length: 255 })
  content?: string;

  @Column({ default: 0 })
  likesCount: number;

  @OneToMany(() => PostComment, (c) => c.post)
  comments: PostComment[];

  @CreateDateColumn()
  createdAt: Date;
}