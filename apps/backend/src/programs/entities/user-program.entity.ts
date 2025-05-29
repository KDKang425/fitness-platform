import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Routine } from '../../routines/entities/routine.entity';

@Entity('user_programs')
@Index(['user', 'isActive'])
export class UserProgram {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userPrograms, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Routine, { onDelete: 'CASCADE' })
  routine: Routine;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  startDate?: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ default: 0 })
  completedSessions: number;

  @Column({ type: 'jsonb', nullable: true })
  progress?: {
    week: number;
    day: number;
    lastSessionId?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}