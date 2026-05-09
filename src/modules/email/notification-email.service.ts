import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { AppMailService } from './app-mail.service';
import { TransactionalEmailService } from './transactional-email.service';

type SendNotificationEmailInput = {
  toEmail: string;
  type: NotificationType;
  message: string;
};

@Injectable()
export class NotificationEmailService {
  constructor(
    private readonly mail: AppMailService,
    private readonly transactional: TransactionalEmailService,
  ) {}

  async sendNotificationEmail(input: SendNotificationEmailInput) {
    if (!this.mail.isEnabled()) return;
    if (!input.toEmail) return;

    await this.transactional.sendNotificationRich({
      to: input.toEmail,
      type: input.type,
      message: input.message,
    });
  }
}
