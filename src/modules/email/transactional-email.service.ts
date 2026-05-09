import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { AppMailService } from './app-mail.service';
import { buttonRow, codeBlock, escapeHtml, wrapMail } from './templates/mail-layout';

@Injectable()
export class TransactionalEmailService {
  private readonly webOrigin: string;

  constructor(
    private readonly mail: AppMailService,
    private readonly config: ConfigService,
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
    const name = escapeHtml(input.firstName.trim() || 'there');
    const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Verify your email</p>
      <p style="margin:0 0 16px 0;">Hi ${name}, thanks for joining HackersDeal. Confirm that <strong>${escapeHtml(
        input.to,
      )}</strong> belongs to you.</p>
      <p style="margin:0 0 8px 0;">Your one-time verification code:</p>
      ${codeBlock(input.otp)}
      <p style="margin:0 0 16px 0;font-size:13px;color:#a3a3a3;">This code and the link below expire in <strong>${
        input.expiresHours
      } hours</strong>.</p>
      ${buttonRow('Verify email (link)', input.verifyUrl)}
      <p style="margin:16px 0 0 0;font-size:13px;color:#a3a3a3;">If the button does not work, paste this URL into your browser:<br/>
      <span style="word-break:break-all;color:#d4d4d4;">${escapeHtml(input.verifyUrl)}</span></p>
      <p style="margin:20px 0 0 0;font-size:13px;color:#737373;">If you did not create an account, you can ignore this message.</p>
    `;
    const html = wrapMail({
      title: 'Verify your HackersDeal email',
      preheader: `Your code is ${input.otp}. Expires in ${input.expiresHours}h.`,
      innerHtml: inner,
    });
    const text = [
      `Hi ${input.firstName.trim() || 'there'},`,
      '',
      'Verify your HackersDeal email with this one-time code:',
      input.otp,
      '',
      `Or open this link (expires in ${input.expiresHours} hours):`,
      input.verifyUrl,
      '',
      'If you did not sign up, ignore this email.',
    ].join('\n');

    await this.mail.send({
      to: input.to,
      subject: 'Verify your HackersDeal email',
      text,
      html,
    });
  }

  async sendEmailVerifiedWelcome(input: { to: string; firstName: string }) {
    const name = escapeHtml(input.firstName.trim() || 'there');
    const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">You are all set</p>
      <p style="margin:0 0 16px 0;">Hi ${name}, your email is verified. Welcome to HackersDeal.</p>
      ${buttonRow('Sign in', `${this.webOrigin}/auth/login`)}
    `;
    const html = wrapMail({
      title: 'Welcome to HackersDeal',
      preheader: 'Your email is verified.',
      innerHtml: inner,
    });
    const text = [
      `Hi ${input.firstName.trim() || 'there'},`,
      '',
      'Your email is verified. Welcome to HackersDeal.',
      '',
      `Sign in: ${this.webOrigin}/auth/login`,
    ].join('\n');
    await this.mail.send({ to: input.to, subject: 'Welcome to HackersDeal', text, html });
  }

  async sendLoginOtp(input: { to: string; code: string; ttlMinutes: number }) {
    const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Your sign-in code</p>
      <p style="margin:0 0 8px 0;">Use this one-time code to sign in to HackersDeal:</p>
      ${codeBlock(input.code)}
      <p style="margin:0;font-size:13px;color:#a3a3a3;">This code expires in ${input.ttlMinutes} minutes. If you did not request it, you can ignore this email.</p>
    `;
    const html = wrapMail({
      title: 'Your HackersDeal login code',
      preheader: `Code ${input.code} · ${input.ttlMinutes} min`,
      innerHtml: inner,
    });
    const text = [
      'Use this one-time code to sign in:',
      '',
      input.code,
      '',
      `Expires in ${input.ttlMinutes} minutes.`,
      '',
      'If you did not request this, ignore this email.',
    ].join('\n');
    await this.mail.send({ to: input.to, subject: 'Your HackersDeal login code', text, html });
  }

  async sendPasswordReset(input: { to: string; resetUrl: string; expiresHours: number }) {
    const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Reset your password</p>
      <p style="margin:0 0 16px 0;">We received a request to reset the password for your HackersDeal account.</p>
      ${buttonRow('Choose a new password', input.resetUrl)}
      <p style="margin:16px 0 0 0;font-size:13px;color:#a3a3a3;">This link expires in <strong>${input.expiresHours} hours</strong>.</p>
      <p style="margin:12px 0 0 0;font-size:13px;color:#737373;">If you did not ask for a reset, you can ignore this email.</p>
    `;
    const html = wrapMail({
      title: 'Reset your HackersDeal password',
      preheader: 'Password reset requested.',
      innerHtml: inner,
    });
    const text = [
      'Reset your HackersDeal password using this link:',
      input.resetUrl,
      '',
      `Link expires in ${input.expiresHours} hours.`,
      '',
      'If you did not request this, ignore this email.',
    ].join('\n');
    await this.mail.send({ to: input.to, subject: 'Reset your HackersDeal password', text, html });
  }

  async sendProjectCreated(input: { to: string; clientName: string; projectTitle: string; projectId: string }) {
    const title = escapeHtml(input.projectTitle);
    const name = escapeHtml(input.clientName.trim() || 'there');
    const url = `${this.webOrigin}/dashboard/projects/${encodeURIComponent(input.projectId)}`;
    const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Project created</p>
      <p style="margin:0 0 16px 0;">Hi ${name}, your project <strong>${title}</strong> has been saved as a draft.</p>
      ${buttonRow('Open project', url)}
    `;
    const html = wrapMail({
      title: 'Your project was created',
      preheader: input.projectTitle,
      innerHtml: inner,
    });
    const text = [
      `Hi ${input.clientName.trim() || 'there'},`,
      '',
      `Your project "${input.projectTitle}" was created (draft).`,
      url,
    ].join('\n');
    await this.mail.send({ to: input.to, subject: `Project created: ${input.projectTitle}`, text, html });
  }

  async sendBidPlacedProviderConfirmation(input: {
    to: string;
    providerName: string;
    projectTitle: string;
    amount: number;
  }) {
    const name = escapeHtml(input.providerName.trim() || 'there');
    const pt = escapeHtml(input.projectTitle);
    const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Bid submitted</p>
      <p style="margin:0 0 16px 0;">Hi ${name}, your bid on <strong>${pt}</strong> was submitted successfully.</p>
      <p style="margin:0;font-size:14px;color:#d4d4d4;">Proposed amount: <strong>${escapeHtml(String(input.amount))}</strong></p>
    `;
    const html = wrapMail({
      title: 'Bid submitted',
      preheader: input.projectTitle,
      innerHtml: inner,
    });
    const text = [
      `Hi ${input.providerName.trim() || 'there'},`,
      '',
      `Your bid on "${input.projectTitle}" was submitted.`,
      `Amount: ${input.amount}`,
    ].join('\n');
    await this.mail.send({ to: input.to, subject: `Bid submitted: ${input.projectTitle}`, text, html });
  }

  async sendNotificationRich(input: { to: string; type: NotificationType; message: string }) {
    const { heading, subject } = this.notificationHeadingSubject(input.type);
    const msg = escapeHtml(input.message);
    const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">${escapeHtml(heading)}</p>
      <p style="margin:0 0 16px 0;">${msg}</p>
      ${buttonRow('Open dashboard', `${this.webOrigin}/dashboard`)}
    `;
    const html = wrapMail({ title: subject, preheader: input.message, innerHtml: inner });
    const text = [heading, '', input.message, '', `${this.webOrigin}/dashboard`].join('\n');
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
