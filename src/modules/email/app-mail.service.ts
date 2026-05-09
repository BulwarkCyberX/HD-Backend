import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

export type SendAppMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type MailDriver = 'smtp' | 'sendgrid' | 'none';

@Injectable()
export class AppMailService {
  private readonly logger = new Logger(AppMailService.name);
  private readonly driver: MailDriver;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly replyTo: string;
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = (
      this.config.get<string>('MAIL_FROM_ADDRESS') ??
      this.config.get<string>('SENDGRID_FROM_EMAIL') ??
      ''
    ).trim();
    this.fromName = (
      this.config.get<string>('MAIL_FROM_NAME') ??
      this.config.get<string>('SENDGRID_FROM_NAME') ??
      'HD Team'
    ).trim();
    this.replyTo = (this.config.get<string>('MAIL_REPLY_TO') ?? this.fromAddress).trim();

    const explicit = (this.config.get<string>('MAIL_PROVIDER') ?? 'auto').toLowerCase();
    const hasSmtp =
      !!this.config.get<string>('GMAIL_SMTP_USER')?.trim() &&
      !!this.config.get<string>('GMAIL_SMTP_APP_PASSWORD')?.trim();
    const hasSendgrid = !!this.config.get<string>('SENDGRID_API_KEY')?.trim();

    if (explicit === 'smtp') this.driver = hasSmtp ? 'smtp' : 'none';
    else if (explicit === 'sendgrid') this.driver = hasSendgrid ? 'sendgrid' : 'none';
    else {
      if (hasSmtp) this.driver = 'smtp';
      else if (hasSendgrid) this.driver = 'sendgrid';
      else this.driver = 'none';
    }

    if (this.driver === 'smtp') {
      const host = this.config.get<string>('GMAIL_SMTP_HOST') ?? 'smtp.gmail.com';
      const port = Number(this.config.get<string>('GMAIL_SMTP_PORT') ?? '587');
      const user = this.config.get<string>('GMAIL_SMTP_USER')!.trim();
      const pass = this.config.get<string>('GMAIL_SMTP_APP_PASSWORD')!.trim();
      this.smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Mail: SMTP (${host}:${port}) as ${user}`);
    } else if (this.driver === 'sendgrid') {
      const apiKey = this.config.get<string>('SENDGRID_API_KEY');
      if (apiKey) sgMail.setApiKey(apiKey);
      this.logger.log('Mail: SendGrid');
    } else {
      this.logger.warn('Mail: disabled (set GMAIL_SMTP_* or SENDGRID_API_KEY, and MAIL_FROM_ADDRESS)');
    }
  }

  isEnabled(): boolean {
    return this.driver !== 'none' && !!this.fromAddress;
  }

  private fromHeader(): string {
    if (this.fromName) return `${this.fromName} <${this.fromAddress}>`;
    return this.fromAddress;
  }

  async send(input: SendAppMailInput): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(`Skip mail to ${input.to}: mail not configured`);
      return;
    }
    if (!input.to?.trim()) return;

    if (this.driver === 'smtp' && this.smtpTransporter) {
      try {
        await this.smtpTransporter.sendMail({
          from: this.fromHeader(),
          to: input.to.trim(),
          replyTo: this.replyTo || undefined,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`SMTP send failed: ${message}`);
      }
      return;
    }

    if (this.driver === 'sendgrid') {
      try {
        await sgMail.send({
          to: input.to.trim(),
          from: { email: this.fromAddress, name: this.fromName },
          replyTo: this.replyTo,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`SendGrid send failed: ${message}`);
      }
    }
  }
}
