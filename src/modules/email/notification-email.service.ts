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

  async sendWeeklyDigestEmail(input: {
    toEmail: string;
    firstName: string;
    items: Array<{ type: string; message: string; createdAt: Date }>;
  }) {
    if (!this.mail.isEnabled()) return;
    if (!input.toEmail) return;
    await this.transactional.sendWeeklyDigest({
      to: input.toEmail,
      firstName: input.firstName,
      items: input.items,
    });
  }
}
