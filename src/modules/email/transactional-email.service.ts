import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { NotificationType } from '@prisma/client';

import { AppMailService } from './app-mail.service';

import { EmailTemplateService } from './email-template.service';



@Injectable()

export class TransactionalEmailService {

  private readonly webOrigin: string;



  constructor(

    private readonly mail: AppMailService,

    private readonly config: ConfigService,

    private readonly templates: EmailTemplateService,

  ) {

    this.webOrigin = (this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');

  }



  async sendSignupVerification(input: {

    to: string;

    firstName: string;

    verifyUrl: string;

    otp: string;

    expiresHours: number;

  }) {

    const { subject, html, text } = await this.templates.render('SIGNUP_VERIFICATION', {

      firstName: input.firstName.trim() || 'there',

      email: input.to,

      otp: input.otp,

      verifyUrl: input.verifyUrl,

      expiresHours: String(input.expiresHours),

    });

    await this.mail.send({ to: input.to, subject, text, html });

  }



  async sendEmailVerifiedWelcome(input: { to: string; firstName: string }) {

    const { subject, html, text } = await this.templates.render('EMAIL_VERIFIED_WELCOME', {

      firstName: input.firstName.trim() || 'there',

      loginUrl: `${this.webOrigin}/auth/login`,

    });

    await this.mail.send({ to: input.to, subject, text, html });

  }



  async sendLoginOtp(input: { to: string; code: string; ttlMinutes: number }) {

    const { subject, html, text } = await this.templates.render('LOGIN_OTP', {

      code: input.code,

      ttlMinutes: String(input.ttlMinutes),

    });

    await this.mail.send({ to: input.to, subject, text, html });

  }



  async sendPasswordReset(input: { to: string; resetUrl: string; expiresHours: number }) {

    const { subject, html, text } = await this.templates.render('PASSWORD_RESET', {

      resetUrl: input.resetUrl,

      expiresHours: String(input.expiresHours),

    });

    await this.mail.send({ to: input.to, subject, text, html });

  }



  async sendProjectCreated(input: { to: string; clientName: string; projectTitle: string; projectId: string }) {

    const { subject, html, text } = await this.templates.render('PROJECT_CREATED', {

      clientName: input.clientName.trim() || 'there',

      projectTitle: input.projectTitle,

      projectUrl: `${this.webOrigin}/dashboard/projects/${encodeURIComponent(input.projectId)}`,

    });

    await this.mail.send({ to: input.to, subject, text, html });

  }



  async sendBidPlacedProviderConfirmation(input: {

    to: string;

    providerName: string;

    projectTitle: string;

    amount: number;

  }) {

    const { subject, html, text } = await this.templates.render('BID_PLACED_PROVIDER', {

      providerName: input.providerName.trim() || 'there',

      projectTitle: input.projectTitle,

      amount: String(input.amount),

    });

    await this.mail.send({ to: input.to, subject, text, html });

  }



  async sendWeeklyDigest(input: {
    to: string;
    firstName: string;
    items: Array<{ type: string; message: string; createdAt: Date }>;
  }) {
    const digestHtml = input.items
      .map(
        (item) =>
          `<p style="margin:0 0 8px 0;"><strong>${this.escapeHtml(item.type)}</strong> — ${this.escapeHtml(item.message)}<br/><span style="font-size:12px;color:#a3a3a3;">${item.createdAt.toISOString().slice(0, 10)}</span></p>`,
      )
      .join('');
    const digestText = input.items
      .map((item) => `- [${item.type}] ${item.message} (${item.createdAt.toISOString().slice(0, 10)})`)
      .join('\n');

    const { subject, html, text } = await this.templates.render('WEEKLY_DIGEST', {
      firstName: input.firstName.trim() || 'there',
      itemCount: String(input.items.length),
      digestHtml,
      digestText,
      dashboardUrl: `${this.webOrigin}/dashboard`,
    });

    await this.mail.send({ to: input.to, subject, html, text });
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async sendNotificationRich(input: { to: string; type: NotificationType; message: string }) {

    const { heading, subject } = this.notificationHeadingSubject(input.type);

    const { html, text } = await this.templates.render('NOTIFICATION_GENERIC', {

      heading,

      message: input.message,

      dashboardUrl: `${this.webOrigin}/dashboard`,

      subject,

    });

    await this.mail.send({ to: input.to, subject, text, html });

  }



  private notificationHeadingSubject(type: NotificationType): { heading: string; subject: string } {

    switch (type) {

      case NotificationType.NEW_BID:

        return { heading: 'New bid on your project', subject: 'New bid received — HackersDeal' };

      case NotificationType.BID_ACCEPTED:

        return { heading: 'Your bid was accepted', subject: 'Bid accepted — HackersDeal' };

      case NotificationType.REPORT_SUBMITTED:

        return { heading: 'New security report', subject: 'New report submitted — HackersDeal' };

      case NotificationType.REPORT_VALIDATED:

        return { heading: 'Report validated', subject: 'Your report was validated — HackersDeal' };

      case NotificationType.PAYMENT_RELEASED:

        return { heading: 'Payment released', subject: 'Escrow payment released — HackersDeal' };

      case NotificationType.BUG_BOUNTY_REPORT_SUBMITTED:

        return { heading: 'New vulnerability submission', subject: 'New bounty submission — HackersDeal' };

      default:

        return { heading: 'HackersDeal update', subject: 'HackersDeal notification' };

    }

  }

}


