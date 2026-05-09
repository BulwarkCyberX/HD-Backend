import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import * as sgMail from '@sendgrid/mail';

type SendNotificationEmailInput = {
  toEmail: string;
  type: NotificationType;
  message: string;
};

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);

  private readonly enabled: boolean;
  private readonly fromEmail?: string;

  constructor(private readonly config: ConfigService) {
    this.enabled =
      this.config.get<string>('SENDGRID_ENABLED') === 'true' ||
      !!this.config.get<string>('SENDGRID_API_KEY');

    this.fromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL');

    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendNotificationEmail(input: SendNotificationEmailInput) {
    if (!this.enabled) return;
    if (!input.toEmail) return;
    if (!this.fromEmail) {
      this.logger.warn('SendGrid enabled but SENDGRID_FROM_EMAIL is not set');
      return;
    }

    const subject = this.buildSubject(input.type);

    // Keep this intentionally plain-text (no HTML templating required for MVP).
    const text = [
      subject,
      '',
      input.message,
      '',
      'View more notifications in your HackersDeal dashboard.',
    ].join('\n');

    try {
      await sgMail.send({
        to: input.toEmail,
        from: this.fromEmail,
        subject,
        text,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`SendGrid send failed: ${message}`);
    }
  }

  private buildSubject(type: NotificationType) {
    switch (type) {
      case NotificationType.NEW_BID:
        return 'New bid received';
      case NotificationType.BID_ACCEPTED:
        return 'Your bid was accepted';
      case NotificationType.REPORT_SUBMITTED:
        return 'New security report submitted';
      case NotificationType.REPORT_VALIDATED:
        return 'Your report was marked valid';
      case NotificationType.PAYMENT_RELEASED:
        return 'Escrow payment released';
      case NotificationType.BUG_BOUNTY_REPORT_SUBMITTED:
        return 'New vulnerability submission received';
      default:
        return 'HackersDeal notification';
    }
  }
}

