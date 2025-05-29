import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from '../email/email.service';

@Processor('email-verification')
export class EmailVerificationProcessor {
  constructor(private readonly emailService: EmailService) {}

  @Process('send-verification')
  async handleVerification(job: Job) {
    const { email, token } = job.data;
    await this.emailService.sendVerificationEmail(email, token);
  }

  @Process('send-password-reset')
  async handlePasswordReset(job: Job) {
    const { email, token } = job.data;
    await this.emailService.sendPasswordResetEmail(email, token);
  }
}