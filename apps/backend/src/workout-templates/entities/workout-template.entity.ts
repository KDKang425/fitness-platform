import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('workout_templates')
export class WorkoutTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'jsonb' })
  exercises: {
    exerciseId: number;
    exerciseName?: string;
    sets: { 
      reps: number; 
      weight: number; 
      restSeconds?: number;
    }[];
  }[];

  @Column({ default: false })
  isQuickStart: boolean;

  @Column({ default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}