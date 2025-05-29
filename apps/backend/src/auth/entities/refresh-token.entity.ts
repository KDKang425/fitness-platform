import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
@Unique(['token'])
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 512 })
  @Index()
  token: string;

  @ManyToOne(() => User, (u) => u.refreshTokens, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;
}
