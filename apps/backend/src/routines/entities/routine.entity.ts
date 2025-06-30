import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkoutSession } from '../../workouts/entities/workout-session.entity';
import { RoutineExercise } from './routine-exercise.entity';
import { RoutineSubscription } from '../../routine-subscriptions/entities/routine-subscription.entity'; // ⬅️ 추가


@Entity('routines')
export class Routine {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  creator?: User | null;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true, length: 255 })
  description?: string;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ nullable: true })
  weeks?: number;

  @OneToMany(() => WorkoutSession, (session) => session.routine)
  workoutSessions: WorkoutSession[];

  @OneToMany(() => RoutineExercise, (re) => re.routine)
  routineExercises: RoutineExercise[];

  @OneToMany(() => RoutineSubscription, (s) => s.routine)
  subscribers: RoutineSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
