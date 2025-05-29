import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('No user found with this email');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified. Please check your email.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    
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
    const verificationToken = uuidv4();
    
    await this.usersService.saveVerificationToken(user.id, verificationToken);
    
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
      email: user.email,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.verifyEmailToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    return {
      message: '이메일 인증이 완료되었습니다.',
      email: user.email,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
      };
    }

    const resetToken = uuidv4();
    await this.usersService.savePasswordResetToken(user.id, resetToken);

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.verifyPasswordResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.updatePassword(user.id, newPassword);

    return {
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}