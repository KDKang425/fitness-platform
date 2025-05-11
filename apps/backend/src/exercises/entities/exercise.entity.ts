import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum MuscleGroup {
  CHEST        = 'CHEST',
  BACK         = 'BACK',
  SHOULDER     = 'SHOULDER',
  TRICEPS      = 'TRICEPS',
  BICEPS       = 'BICEPS',
  FOREARM      = 'FOREARM',
  ABS          = 'ABS',
  GLUTES       = 'GLUTES',
  HAMSTRING    = 'HAMSTRING',
  QUADRICEPS   = 'QUADRICEPS',
  TRAPS        = 'TRAPS',
  CALVES       = 'CALVES',
}

export enum ExerciseModality {
  CARDIO        = 'CARDIO',
  BARBELL       = 'BARBELL',
  DUMBBELL      = 'DUMBBELL',
  BODYWEIGHT    = 'BODYWEIGHT',
  MACHINE       = 'MACHINE',
  CABLE         = 'CABLE',
  SMITH_MACHINE = 'SMITH_MACHINE',
}

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  muscle_group?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  difficulty?: string;

  @Column({ nullable: true })
  video_url?: string;

  @Column({ nullable: true })
  image_url?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'enum', enum: MuscleGroup })
  category: MuscleGroup;

  @Column({ type: 'enum', enum: ExerciseModality })
  modality: ExerciseModality;
}
