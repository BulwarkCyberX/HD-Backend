import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';
import { PrismaService } from '../../prisma/prisma.service';
import { MailProvider } from '@prisma/client';

export type SendAppMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type MailDriver = 'smtp' | 'sendgrid' | 'aws_ses' | 'postmark' | 'none';

type ResolvedMailConfig = {
  driver: MailDriver;
  fromAddress: string;
  fromName: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  sendgridApiKey: string;
  awsSesAccessKeyId: string;
  awsSesSecretKey: string;
  awsSesRegion: string;
  postmarkServerToken: string;
};

@Injectable()
export class AppMailService {
  private readonly logger = new Logger(AppMailService.name);

  // Fallback config from env (used if DB settings are empty)
  private readonly envFromAddress: string;
  private readonly envFromName: string;
  private readonly envReplyTo: string;
  private readonly envDriver: MailDriver;
  private envSmtpTransporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.envFromAddress = (
      this.config.get<string>('MAIL_FROM_ADDRESS') ??
      this.config.get<string>('SENDGRID_FROM_EMAIL') ??
      ''
    ).trim();
    this.envFromName = (
      this.config.get<string>('MAIL_FROM_NAME') ??
      this.config.get<string>('SENDGRID_FROM_NAME') ??
      'HD Team'
    ).trim();
    this.envReplyTo = (this.config.get<string>('MAIL_REPLY_TO') ?? this.envFromAddress).trim();

    const explicit = (this.config.get<string>('MAIL_PROVIDER') ?? 'auto').toLowerCase();
    const hasSmtp =
      !!this.config.get<string>('GMAIL_SMTP_USER')?.trim() &&
      !!this.config.get<string>('GMAIL_SMTP_APP_PASSWORD')?.trim();
    const hasSendgrid = !!this.config.get<string>('SENDGRID_API_KEY')?.trim();

    if (explicit === 'smtp') this.envDriver = hasSmtp ? 'smtp' : 'none';
    else if (explicit === 'sendgrid') this.envDriver = hasSendgrid ? 'sendgrid' : 'none';
    else {
      if (hasSmtp) this.envDriver = 'smtp';
      else if (hasSendgrid) this.envDriver = 'sendgrid';
      else this.envDriver = 'none';
    }

    if (this.envDriver === 'smtp') {
      const host = this.config.get<string>('GMAIL_SMTP_HOST') ?? 'smtp.gmail.com';
      const port = Number(this.config.get<string>('GMAIL_SMTP_PORT') ?? '587');
      const user = this.config.get<string>('GMAIL_SMTP_USER')!.trim();
      const pass = this.config.get<string>('GMAIL_SMTP_APP_PASSWORD')!.trim();
      this.envSmtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Mail (env): SMTP (${host}:${port}) as ${user}`);
    } else if (this.envDriver === 'sendgrid') {
      const apiKey = this.config.get<string>('SENDGRID_API_KEY');
      if (apiKey) sgMail.setApiKey(apiKey);
      this.logger.log('Mail (env): SendGrid');
    } else {
      this.logger.warn('Mail (env): disabled — will check DB settings at send time');
    }
  }

  /** Resolve effective mail config: DB settings take priority over env vars */
  private async resolveConfig(): Promise<ResolvedMailConfig> {
    const emptyConfig = (driver: MailDriver, fromAddress: string, fromName: string, replyTo: string): ResolvedMailConfig => ({
      driver, fromAddress, fromName, replyTo,
      smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '',
      sendgridApiKey: '', awsSesAccessKeyId: '', awsSesSecretKey: '', awsSesRegion: 'us-east-1', postmarkServerToken: '',
    });

    try {
      const dbSettings = await this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
      if (dbSettings && dbSettings.mailProvider !== MailProvider.AUTO) {
        // DB has explicit provider set
        const fromAddress = dbSettings.mailFromAddress || this.envFromAddress;
        const fromName = dbSettings.mailFromName || this.envFromName;
        const replyTo = dbSettings.mailReplyTo || fromAddress;

        if (dbSettings.mailProvider === MailProvider.NONE) {
          return emptyConfig('none', fromAddress, fromName, replyTo);
        }
        if (dbSettings.mailProvider === MailProvider.SMTP && dbSettings.smtpUser && dbSettings.smtpPassword) {
          return {
            ...emptyConfig('smtp', fromAddress, fromName, replyTo),
            smtpHost: dbSettings.smtpHost || 'smtp.gmail.com',
            smtpPort: dbSettings.smtpPort || 587,
            smtpUser: dbSettings.smtpUser,
            smtpPass: dbSettings.smtpPassword,
          };
        }
        if (dbSettings.mailProvider === MailProvider.SENDGRID && dbSettings.sendgridApiKey) {
          return { ...emptyConfig('sendgrid', fromAddress, fromName, replyTo), sendgridApiKey: dbSettings.sendgridApiKey };
        }
        if (dbSettings.mailProvider === MailProvider.AWS_SES && dbSettings.awsSesAccessKeyId && dbSettings.awsSesSecretKey) {
          return {
            ...emptyConfig('aws_ses', fromAddress, fromName, replyTo),
            awsSesAccessKeyId: dbSettings.awsSesAccessKeyId,
            awsSesSecretKey: dbSettings.awsSesSecretKey,
            awsSesRegion: dbSettings.awsSesRegion || 'us-east-1',
          };
        }
        if (dbSettings.mailProvider === MailProvider.POSTMARK && dbSettings.postmarkServerToken) {
          return { ...emptyConfig('postmark', fromAddress, fromName, replyTo), postmarkServerToken: dbSettings.postmarkServerToken };
        }
      }

      // AUTO mode from DB: use primaryMailProvider as first choice, then fallback order
      if (dbSettings) {
        const fromAddress = dbSettings.mailFromAddress || this.envFromAddress;
        const fromName = dbSettings.mailFromName || this.envFromName;
        const replyTo = dbSettings.mailReplyTo || fromAddress;

        // Build ordered list based on primaryMailProvider
        const primary = dbSettings.primaryMailProvider || MailProvider.SMTP;
        const allProviders: MailProvider[] = [MailProvider.SMTP, MailProvider.SENDGRID, MailProvider.AWS_SES, MailProvider.POSTMARK];
        const ordered = [primary, ...allProviders.filter(p => p !== primary)];

        for (const p of ordered) {
          if (p === MailProvider.SMTP && dbSettings.smtpUser && dbSettings.smtpPassword) {
            return {
              ...emptyConfig('smtp', fromAddress, fromName, replyTo),
              smtpHost: dbSettings.smtpHost || 'smtp.gmail.com',
              smtpPort: dbSettings.smtpPort || 587,
              smtpUser: dbSettings.smtpUser,
              smtpPass: dbSettings.smtpPassword,
            };
          }
          if (p === MailProvider.SENDGRID && dbSettings.sendgridApiKey) {
            return { ...emptyConfig('sendgrid', fromAddress, fromName, replyTo), sendgridApiKey: dbSettings.sendgridApiKey };
          }
          if (p === MailProvider.AWS_SES && dbSettings.awsSesAccessKeyId && dbSettings.awsSesSecretKey) {
            return {
              ...emptyConfig('aws_ses', fromAddress, fromName, replyTo),
              awsSesAccessKeyId: dbSettings.awsSesAccessKeyId,
              awsSesSecretKey: dbSettings.awsSesSecretKey,
              awsSesRegion: dbSettings.awsSesRegion || 'us-east-1',
            };
          }
          if (p === MailProvider.POSTMARK && dbSettings.postmarkServerToken) {
            return { ...emptyConfig('postmark', fromAddress, fromName, replyTo), postmarkServerToken: dbSettings.postmarkServerToken };
          }
        }
      }
    } catch {
      // DB not available, fall through to env
    }

    // Fallback to env-based config
    return {
      driver: this.envDriver,
      fromAddress: this.envFromAddress,
      fromName: this.envFromName,
      replyTo: this.envReplyTo,
      smtpHost: this.config.get<string>('GMAIL_SMTP_HOST') ?? 'smtp.gmail.com',
      smtpPort: Number(this.config.get<string>('GMAIL_SMTP_PORT') ?? '587'),
      smtpUser: this.config.get<string>('GMAIL_SMTP_USER') ?? '',
      smtpPass: this.config.get<string>('GMAIL_SMTP_APP_PASSWORD') ?? '',
      sendgridApiKey: this.config.get<string>('SENDGRID_API_KEY') ?? '',
      awsSesAccessKeyId: '',
      awsSesSecretKey: '',
      awsSesRegion: 'us-east-1',
      postmarkServerToken: '',
    };
  }

  isEnabled(): boolean {
    // Quick check for env-based config (sync); actual send() does async DB check
    return this.envDriver !== 'none' || !!this.envFromAddress;
  }

  async send(input: SendAppMailInput): Promise<void> {
    if (!input.to?.trim()) return;

    const cfg = await this.resolveConfig();

    if (cfg.driver === 'none' || !cfg.fromAddress) {
      this.logger.warn(`[MAIL SKIP] to=${input.to} reason=not_configured driver=${cfg.driver} fromAddress="${cfg.fromAddress}"`);
      return;
    }

    this.logger.log(`[MAIL SEND] to=${input.to} subject="${input.subject}" driver=${cfg.driver} from=${cfg.fromAddress}`);

    const fromHeader = cfg.fromName ? `${cfg.fromName} <${cfg.fromAddress}>` : cfg.fromAddress;

    if (cfg.driver === 'smtp') {
      try {
        // Create transporter dynamically if DB creds differ from env
        const transporter = this.envSmtpTransporter && cfg.smtpUser === (this.config.get<string>('GMAIL_SMTP_USER') ?? '').trim()
          ? this.envSmtpTransporter
          : nodemailer.createTransport({
              host: cfg.smtpHost,
              port: cfg.smtpPort,
              secure: cfg.smtpPort === 465,
              auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
            });

        const info = await transporter.sendMail({
          from: fromHeader,
          to: input.to.trim(),
          replyTo: cfg.replyTo || undefined,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });
        this.logger.log(`[MAIL OK] to=${input.to} messageId=${info.messageId ?? 'n/a'}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`[MAIL FAIL] SMTP to=${input.to} error=${message}`);
      }
      return;
    }

    if (cfg.driver === 'sendgrid') {
      try {
        if (cfg.sendgridApiKey) sgMail.setApiKey(cfg.sendgridApiKey);
        await sgMail.send({
          to: input.to.trim(),
          from: { email: cfg.fromAddress, name: cfg.fromName },
          replyTo: cfg.replyTo,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });
        this.logger.log(`[MAIL OK] SendGrid to=${input.to}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`[MAIL FAIL] SendGrid to=${input.to} error=${message}`);
      }
    }

    if (cfg.driver === 'aws_ses') {
      try {
        // Use nodemailer SES transport (works without @aws-sdk/client-ses package)
        const transporter = nodemailer.createTransport({
          host: `email-smtp.${cfg.awsSesRegion}.amazonaws.com`,
          port: 587,
          secure: false,
          auth: { user: cfg.awsSesAccessKeyId, pass: cfg.awsSesSecretKey },
        });
        const info = await transporter.sendMail({
          from: fromHeader,
          to: input.to.trim(),
          replyTo: cfg.replyTo || undefined,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });
        this.logger.log(`[MAIL OK] AWS SES to=${input.to} messageId=${info.messageId ?? 'n/a'}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`[MAIL FAIL] AWS SES to=${input.to} error=${message}`);
      }
    }

    if (cfg.driver === 'postmark') {
      try {
        const response = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': cfg.postmarkServerToken,
          },
          body: JSON.stringify({
            From: fromHeader,
            To: input.to.trim(),
            ReplyTo: cfg.replyTo || undefined,
            Subject: input.subject,
            TextBody: input.text,
            HtmlBody: input.html || undefined,
          }),
        });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Postmark API ${response.status}: ${body}`);
        }
        this.logger.log(`[MAIL OK] Postmark to=${input.to}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`[MAIL FAIL] Postmark to=${input.to} error=${message}`);
      }
    }
  }
}
