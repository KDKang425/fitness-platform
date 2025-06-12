import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('push_tokens')
@Index(['userId', 'token'], { unique: true })
export class PushToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  token: string;

  @Column({ type: 'enum', enum: ['ios', 'android', 'web'] })
  platform: 'ios' | 'android' | 'web';

  @Column({ nullable: true })
  deviceId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}