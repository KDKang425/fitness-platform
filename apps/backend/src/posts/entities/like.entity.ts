import {
  Entity, PrimaryGeneratedColumn, ManyToOne,
  Unique, CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Post } from 'src/posts/entities/post.entity';

@Entity('likes')
@Unique('likes_user_id_post_id_key', ['user', 'post'])
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: false })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}
