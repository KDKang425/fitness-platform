import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Routine } from '../../routines/entities/routine.entity';

@Entity('routine_subscriptions')
@Unique('UQ_user_routine', ['user', 'routine'])
export class RoutineSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.routineSubscriptions, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Routine, (r) => r.subscribers, {
    onDelete: 'CASCADE',
  })
  routine: Routine;

  @CreateDateColumn()
  subscribedAt: Date;
}
