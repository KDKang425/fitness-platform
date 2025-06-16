import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { WorkoutSession } from 'src/workouts/entities/workout-session.entity';
import { Exercise } from 'src/exercises/entities/exercise.entity';

@Entity('workout_sets')
export class WorkoutSet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkoutSession, { onDelete: 'CASCADE', nullable: false })
  workoutSession: WorkoutSession;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE', nullable: false })
  exercise: Exercise;

  @Column({ name: 'set_number' })
  setNumber: number;

  @Column()
  reps: number;

  @Column()
  weight: number;

  @Column()
  volume: number;

  @Column({ default: false })
  isCompleted: boolean;
}
