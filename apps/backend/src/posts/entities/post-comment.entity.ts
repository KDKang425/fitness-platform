import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from './post.entity';

@Entity('post_comments')
export class PostComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, (u) => u.postComments, { onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => Post, (p) => p.comments, { onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => PostComment, (c) => c.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent: PostComment | null;

  @OneToMany(() => PostComment, (c) => c.parent)
  children: PostComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
