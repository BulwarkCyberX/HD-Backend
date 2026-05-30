import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppMailService } from '../email/app-mail.service';
import { MailProvider, SessionPolicy } from '@prisma/client';

export type PlatformSettingsDto = {
  mailProvider: MailProvider;
  primaryMailProvider: MailProvider;
  mailFromAddress: string;
  mailFromName: string;
  mailReplyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  sendgridApiKey: string;
  awsSesAccessKeyId: string;
  awsSesSecretKey: string;
  awsSesRegion: string;
  postmarkServerToken: string;
  accessTokenExpiryMinutes: number;
  refreshTokenExpiryDays: number;
  emailVerificationCodeValue: number;
  emailVerificationCodeUnit: string;
  loginOtpCodeValue: number;
  loginOtpCodeUnit: string;
  sessionPolicy: SessionPolicy;
  maxConcurrentSessions: number;
};

@Injectable()
export class PlatformSettingsService {
  private readonly logger = new Logger(PlatformSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: AppMailService,
  ) {}

  async get(): Promise<PlatformSettingsDto> {
    const row = await this.prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
    return {
      mailProvider: row.mailProvider,
      primaryMailProvider: row.primaryMailProvider,
      mailFromAddress: row.mailFromAddress,
      mailFromName: row.mailFromName,
      mailReplyTo: row.mailReplyTo,
      smtpHost: row.smtpHost,
      smtpPort: row.smtpPort,
      smtpUser: row.smtpUser,
      smtpPassword: row.smtpPassword ? '••••••••' : '',
      sendgridApiKey: row.sendgridApiKey ? '••••••••' : '',
      awsSesAccessKeyId: row.awsSesAccessKeyId ? '••••••••' : '',
      awsSesSecretKey: row.awsSesSecretKey ? '••••••••' : '',
      awsSesRegion: row.awsSesRegion,
      postmarkServerToken: row.postmarkServerToken ? '••••••••' : '',
      accessTokenExpiryMinutes: row.accessTokenExpiryMinutes,
      refreshTokenExpiryDays: row.refreshTokenExpiryDays,
      emailVerificationCodeValue: row.emailVerificationCodeValue,
      emailVerificationCodeUnit: row.emailVerificationCodeUnit,
      loginOtpCodeValue: row.loginOtpCodeValue,
      loginOtpCodeUnit: row.loginOtpCodeUnit,
      sessionPolicy: row.sessionPolicy,
      maxConcurrentSessions: row.maxConcurrentSessions,
    };
  }

  /** Returns raw settings (with secrets) for internal use by mail/session services */
  async getRaw() {
    return this.prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
  }

  async update(data: Partial<Omit<PlatformSettingsDto, 'smtpPassword' | 'sendgridApiKey' | 'awsSesSecretKey' | 'postmarkServerToken'>> & {
    smtpPassword?: string;
    sendgridApiKey?: string;
    awsSesSecretKey?: string;
    postmarkServerToken?: string;
  }) {
    const updateData: Record<string, unknown> = {};

    if (data.mailProvider !== undefined) updateData.mailProvider = data.mailProvider;
    if (data.primaryMailProvider !== undefined) updateData.primaryMailProvider = data.primaryMailProvider;
    if (data.mailFromAddress !== undefined) updateData.mailFromAddress = data.mailFromAddress.trim();
    if (data.mailFromName !== undefined) updateData.mailFromName = data.mailFromName.trim();
    if (data.mailReplyTo !== undefined) updateData.mailReplyTo = data.mailReplyTo.trim();
    if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost.trim();
    if (data.smtpPort !== undefined) updateData.smtpPort = Number(data.smtpPort);
    if (data.smtpUser !== undefined) updateData.smtpUser = data.smtpUser.trim();
    // Only update secrets if a real value is provided (not the masked placeholder)
    if (data.smtpPassword && data.smtpPassword !== '••••••••') {
      updateData.smtpPassword = data.smtpPassword;
    }
    if (data.sendgridApiKey && data.sendgridApiKey !== '••••••••') {
      updateData.sendgridApiKey = data.sendgridApiKey;
    }
    // AWS SES credentials
    if (data.awsSesAccessKeyId !== undefined && data.awsSesAccessKeyId !== '••••••••') {
      updateData.awsSesAccessKeyId = data.awsSesAccessKeyId.trim();
    }
    if (data.awsSesSecretKey && data.awsSesSecretKey !== '••••••••') {
      updateData.awsSesSecretKey = data.awsSesSecretKey;
    }
    if (data.awsSesRegion !== undefined) updateData.awsSesRegion = data.awsSesRegion.trim();
    // Postmark credentials
    if (data.postmarkServerToken && data.postmarkServerToken !== '••••••••') {
      updateData.postmarkServerToken = data.postmarkServerToken;
    }
    if (data.accessTokenExpiryMinutes !== undefined) {
      updateData.accessTokenExpiryMinutes = Math.max(1, Math.min(1440, Number(data.accessTokenExpiryMinutes)));
    }
    if (data.refreshTokenExpiryDays !== undefined) {
      updateData.refreshTokenExpiryDays = Math.max(1, Math.min(90, Number(data.refreshTokenExpiryDays)));
    }
    if (data.emailVerificationCodeValue !== undefined) {
      updateData.emailVerificationCodeValue = Math.max(1, Math.min(999, Number(data.emailVerificationCodeValue)));
    }
    if (data.emailVerificationCodeUnit !== undefined) {
      const unit = String(data.emailVerificationCodeUnit).toUpperCase();
      if (['MINUTES', 'HOURS', 'DAYS'].includes(unit)) {
        updateData.emailVerificationCodeUnit = unit;
      }
    }
    if (data.loginOtpCodeValue !== undefined) {
      updateData.loginOtpCodeValue = Math.max(1, Math.min(999, Number(data.loginOtpCodeValue)));
    }
    if (data.loginOtpCodeUnit !== undefined) {
      const unit = String(data.loginOtpCodeUnit).toUpperCase();
      if (['MINUTES', 'HOURS', 'DAYS'].includes(unit)) {
        updateData.loginOtpCodeUnit = unit;
      }
    }
    if (data.sessionPolicy !== undefined) updateData.sessionPolicy = data.sessionPolicy;
    if (data.maxConcurrentSessions !== undefined) {
      updateData.maxConcurrentSessions = Math.max(0, Math.min(50, Number(data.maxConcurrentSessions)));
    }

    const row = await this.prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...updateData },
      update: updateData,
    });

    this.logger.log('Platform settings updated');

    return {
      mailProvider: row.mailProvider,
      primaryMailProvider: row.primaryMailProvider,
      mailFromAddress: row.mailFromAddress,
      mailFromName: row.mailFromName,
      mailReplyTo: row.mailReplyTo,
      smtpHost: row.smtpHost,
      smtpPort: row.smtpPort,
      smtpUser: row.smtpUser,
      smtpPassword: row.smtpPassword ? '••••••••' : '',
      sendgridApiKey: row.sendgridApiKey ? '••••••••' : '',
      awsSesAccessKeyId: row.awsSesAccessKeyId ? '••••••••' : '',
      awsSesSecretKey: row.awsSesSecretKey ? '••••••••' : '',
      awsSesRegion: row.awsSesRegion,
      postmarkServerToken: row.postmarkServerToken ? '••••••••' : '',
      accessTokenExpiryMinutes: row.accessTokenExpiryMinutes,
      refreshTokenExpiryDays: row.refreshTokenExpiryDays,
      emailVerificationCodeValue: row.emailVerificationCodeValue,
      emailVerificationCodeUnit: row.emailVerificationCodeUnit,
      loginOtpCodeValue: row.loginOtpCodeValue,
      loginOtpCodeUnit: row.loginOtpCodeUnit,
      sessionPolicy: row.sessionPolicy,
      maxConcurrentSessions: row.maxConcurrentSessions,
    };
  }

  async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    this.logger.log(`Test email requested to: ${to}`);
    try {
      await this.mail.send({
        to,
        subject: '✅ HackersDeal — Test Email',
        text: 'This is a test email from HackersDeal platform settings. If you received this, your email configuration is working correctly.',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #097C87;">✅ Email Configuration Working</h2>
            <p>This is a test email sent from the <strong>HackersDeal Admin Panel</strong>.</p>
            <p>If you're reading this, your SMTP/mail settings are configured correctly.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 12px; color: #64748b;">Sent at: ${new Date().toISOString()}</p>
          </div>
        `,
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Test email failed: ${message}`);
      return { success: false, error: message };
    }
  }
}
