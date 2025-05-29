import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notification_settings')
export class NotificationSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ default: true })
  workoutReminders: boolean;

  @Column({ default: true })
  socialNotifications: boolean;

  @Column({ default: true })
  achievementNotifications: boolean;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ type: 'jsonb', nullable: true })
  workoutReminderTimes?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}