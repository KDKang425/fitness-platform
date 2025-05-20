import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  Unique,
} from 'typeorm';
import { Routine } from 'src/routines/entities/routine.entity';
import { Exercise } from 'src/exercises/entities/exercise.entity';

@Entity('routine_exercises')
@Unique('routine_exercises_routine_id_exercise_id_key', ['routine', 'exercise'])
export class RoutineExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Routine, { onDelete: 'CASCADE', nullable: false })
  routine: Routine;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE', nullable: false })
  exercise: Exercise;

  @Column({ nullable: true })
  exerciseOrder?: number;

  @Column({ nullable: true })
  defaultSets?: number;

  @Column({ nullable: true })
  defaultReps?: number;

  @Column({ nullable: true })
  defaultWeight?: number;
}
