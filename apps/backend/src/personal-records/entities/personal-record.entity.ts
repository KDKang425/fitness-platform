import {
  Entity, PrimaryGeneratedColumn, ManyToOne,
  Column, UpdateDateColumn, Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

@Entity('personal_records')
@Unique('UQ_user_exercise', ['user', 'exercise'])
export class PersonalRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.personalRecords, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Exercise, { eager: true, onDelete: 'CASCADE' })
  exercise: Exercise;

  @Column('int')
  bestWeight: number;      

  @Column('int')
  bestReps: number;       

  @Column('int')
  estimated1RM: number;    

  @UpdateDateColumn()
  updatedAt: Date;
}
