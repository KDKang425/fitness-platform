import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokensService } from './refresh-tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly refreshSvc: RefreshTokensService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    //if (!user.emailVerified)
      //throw new UnauthorizedException('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    await this.refreshSvc.create(user, refreshToken, 7 * 24 * 3600);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl,
        hasCompletedInitialSetup: user.hasCompletedInitialSetup,
      },
    };
  }

  async register(dto: any) {
    const user = await this.usersService.createUser(dto);
   // const verificationToken = uuidv4();
   // await this.usersService.saveVerificationToken(user.id, verificationToken);
   // await this.emailService.sendVerificationEmail(user.email, verificationToken);
    return {
      message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
      email: user.email,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.verifyEmailToken(token);
    if (!user) throw new BadRequestException('유효하지 않거나 만료된 인증 토큰입니다.');
    return { message: '이메일 인증이 완료되었습니다.', email: user.email };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const resetToken = uuidv4();
      await this.usersService.savePasswordResetToken(user.id, resetToken);
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    }
    return { message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.verifyPasswordResetToken(token);
    if (!user) throw new BadRequestException('유효하지 않거나 만료된 재설정 토큰입니다.');
    await this.usersService.updatePassword(user.id, newPassword);
    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }

  async refreshTokens(oldToken: string) {
    const user = await this.refreshSvc.validate(oldToken);
    const payload = { sub: user.id, email: user.email };
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    await this.refreshSvc.rotate(oldToken, user, newRefreshToken, 7 * 24 * 3600);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
