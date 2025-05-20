import {
  Entity, PrimaryGeneratedColumn, ManyToOne,
  Unique, CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('follows')
@Unique('follows_follower_id_following_id_key', ['follower', 'following'])
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  follower: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  following: User;

  @CreateDateColumn()
  createdAt: Date;
}
