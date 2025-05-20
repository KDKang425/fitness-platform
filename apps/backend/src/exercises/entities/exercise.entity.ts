import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum MuscleGroup {
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDER = 'SHOULDER',
  TRICEPS = 'TRICEPS',
  BICEPS = 'BICEPS',
  FOREARM = 'FOREARM',
  ABS = 'ABS',
  GLUTES = 'GLUTES',
  HAMSTRING = 'HAMSTRING',
  QUADRICEPS = 'QUADRICEPS',
  TRAPS = 'TRAPS',
  CALVES = 'CALVES',
}

export enum ExerciseModality {
  CARDIO = 'CARDIO',
  BARBELL = 'BARBELL',
  DUMBBELL = 'DUMBBELL',
  BODYWEIGHT = 'BODYWEIGHT',
  MACHINE = 'MACHINE',
  CABLE = 'CABLE',
  SMITH_MACHINE = 'SMITH_MACHINE',
}

@Entity('exercises')
@Unique('exercises_name_key', ['name'])
export class Exercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: MuscleGroup,
    enumName: 'muscle_enum',          
  })
  category: MuscleGroup;

  @Column({
    type: 'enum',
    enum: ExerciseModality,
    enumName: 'modality_enum',     
  })
  modality: ExerciseModality;

  @Column({ nullable: true, length: 50 })
  difficulty?: string;

  @Column({ nullable: true, length: 255 })
  videoUrl?: string;

  @Column({ nullable: true, length: 255 })
  imageUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}