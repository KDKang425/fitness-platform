import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('daily_stats')
@Unique(['user', 'date'])
@Index(['user', 'date'])
export class DailyStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 0 })
  totalVolume: number;

  @Column({ default: 0 })
  sessionCount: number;

  @Column({ default: 0 })
  setCount: number;

  @Column({ default: 0 })
  totalTime: number;

  @Column({ type: 'jsonb', nullable: true })
  muscleVolume?: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  exerciseVolume?: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;
}