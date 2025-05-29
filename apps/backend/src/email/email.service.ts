import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter;
  private emailFrom: string;
  private usesSendGrid: boolean;

  constructor(private configService: ConfigService) {
    this.emailFrom = this.configService.get('EMAIL_FROM', 'noreply@fitnessapp.com');
    
    const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');
    
    if (sendgridApiKey) {
      this.usesSendGrid = true;
      sgMail.setApiKey(sendgridApiKey);
    } else {
      this.usesSendGrid = false;
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        secure: this.configService.get('SMTP_SECURE', false),
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (this.usesSendGrid) {
      const msg = {
        to: options.to,
        from: this.emailFrom,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      };
      
      await sgMail.send(msg);
    } else {
      await this.transporter.sendMail({
        from: this.emailFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    
    const html = `
      <h1>이메일 인증</h1>
      <p>안녕하세요!</p>
      <p>아래 링크를 클릭하여 이메일을 인증해주세요:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">이메일 인증하기</a>
      <p>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
      <p>${verificationUrl}</p>
      <p>링크는 24시간 동안 유효합니다.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: '피트니스 앱 - 이메일 인증',
      html,
      text: `이메일 인증 링크: ${verificationUrl}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    
    const html = `
      <h1>비밀번호 재설정</h1>
      <p>안녕하세요!</p>
      <p>비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 새 비밀번호를 설정하세요:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">비밀번호 재설정</a>
      <p>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
      <p>${resetUrl}</p>
      <p>링크는 1시간 동안 유효합니다.</p>
      <p>만약 비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: '피트니스 앱 - 비밀번호 재설정',
      html,
      text: `비밀번호 재설정 링크: ${resetUrl}`,
    });
  }

  async sendWorkoutReminderEmail(email: string, workoutName: string, time: string): Promise<void> {
    const html = `
      <h1>운동 리마인더 🏋️</h1>
      <p>안녕하세요!</p>
      <p><strong>${time}</strong>에 예정된 <strong>${workoutName}</strong> 운동 시간입니다!</p>
      <p>오늘도 목표를 향해 한 걸음 더 나아가세요! 💪</p>
      <a href="${this.configService.get('FRONTEND_URL')}/workout" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">운동 시작하기</a>
    `;

    await this.sendEmail({
      to: email,
      subject: `운동 리마인더 - ${workoutName}`,
      html,
      text: `${time}에 ${workoutName} 운동이 예정되어 있습니다.`,
    });
  }
}