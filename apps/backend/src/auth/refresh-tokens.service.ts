import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private repo: Repository<RefreshToken>,
  ) {}

  async create(user: User, token: string, ttlSeconds: number) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.repo.save({ token, user, expiresAt });
  }

  async rotate(oldToken: string, user: User, newToken: string, ttlSeconds: number) {
    await this.repo.update({ token: oldToken }, { revoked: true });
    await this.create(user, newToken, ttlSeconds);
  }

  async validate(token: string) {
    const data = await this.repo.findOne({
      where: { token, revoked: false },
      relations: ['user'],
    });
    if (!data || data.expiresAt.getTime() < Date.now()) throw new UnauthorizedException();
    return data.user;
  }

  async revokeForUser(userId: number) {
    await this.repo.update({ user: { id: userId } }, { revoked: true });
  }
}
