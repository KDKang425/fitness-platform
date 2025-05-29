import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('workout_templates')
@Index(['isPublic', 'subscriberCount']) 
@Index(['user', 'isQuickStart']) 
export class WorkoutTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  exercises: {
    exerciseId: number;
    exerciseName?: string;
    sets: { 
      reps: number; 
      weight: number; 
      restSeconds?: number;
      notes?: string;
    }[];
  }[];

  @Column({ default: false })
  isQuickStart: boolean;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: 0 })
  subscriberCount: number;

  @Column({ default: 0 })
  cloneCount: number;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ 
    type: 'enum', 
    enum: ['beginner', 'intermediate', 'advanced'],
    nullable: true 
  })
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @Column({ nullable: true })
  estimatedDuration?: number;

  @Column({ type: 'jsonb', nullable: true })
  targetMuscles?: {
    primary: string[];
    secondary: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}