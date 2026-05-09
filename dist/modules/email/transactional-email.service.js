"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionalEmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const app_mail_service_1 = require("./app-mail.service");
const mail_layout_1 = require("./templates/mail-layout");
let TransactionalEmailService = class TransactionalEmailService {
    constructor(mail, config) {
        this.mail = mail;
        this.config = config;
        this.webOrigin = (this.config.get('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');
    }
    async sendSignupVerification(input) {
        const name = (0, mail_layout_1.escapeHtml)(input.firstName.trim() || 'there');
        const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Verify your email</p>
      <p style="margin:0 0 16px 0;">Hi ${name}, thanks for joining HackersDeal. Confirm that <strong>${(0, mail_layout_1.escapeHtml)(input.to)}</strong> belongs to you.</p>
      <p style="margin:0 0 8px 0;">Your one-time verification code:</p>
      ${(0, mail_layout_1.codeBlock)(input.otp)}
      <p style="margin:0 0 16px 0;font-size:13px;color:#a3a3a3;">This code and the link below expire in <strong>${input.expiresHours} hours</strong>.</p>
      ${(0, mail_layout_1.buttonRow)('Verify email (link)', input.verifyUrl)}
      <p style="margin:16px 0 0 0;font-size:13px;color:#a3a3a3;">If the button does not work, paste this URL into your browser:<br/>
      <span style="word-break:break-all;color:#d4d4d4;">${(0, mail_layout_1.escapeHtml)(input.verifyUrl)}</span></p>
      <p style="margin:20px 0 0 0;font-size:13px;color:#737373;">If you did not create an account, you can ignore this message.</p>
    `;
        const html = (0, mail_layout_1.wrapMail)({
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
    async sendEmailVerifiedWelcome(input) {
        const name = (0, mail_layout_1.escapeHtml)(input.firstName.trim() || 'there');
        const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">You are all set</p>
      <p style="margin:0 0 16px 0;">Hi ${name}, your email is verified. Welcome to HackersDeal.</p>
      ${(0, mail_layout_1.buttonRow)('Sign in', `${this.webOrigin}/auth/login`)}
    `;
        const html = (0, mail_layout_1.wrapMail)({
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
    async sendLoginOtp(input) {
        const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Your sign-in code</p>
      <p style="margin:0 0 8px 0;">Use this one-time code to sign in to HackersDeal:</p>
      ${(0, mail_layout_1.codeBlock)(input.code)}
      <p style="margin:0;font-size:13px;color:#a3a3a3;">This code expires in ${input.ttlMinutes} minutes. If you did not request it, you can ignore this email.</p>
    `;
        const html = (0, mail_layout_1.wrapMail)({
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
    async sendPasswordReset(input) {
        const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Reset your password</p>
      <p style="margin:0 0 16px 0;">We received a request to reset the password for your HackersDeal account.</p>
      ${(0, mail_layout_1.buttonRow)('Choose a new password', input.resetUrl)}
      <p style="margin:16px 0 0 0;font-size:13px;color:#a3a3a3;">This link expires in <strong>${input.expiresHours} hours</strong>.</p>
      <p style="margin:12px 0 0 0;font-size:13px;color:#737373;">If you did not ask for a reset, you can ignore this email.</p>
    `;
        const html = (0, mail_layout_1.wrapMail)({
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
    async sendProjectCreated(input) {
        const title = (0, mail_layout_1.escapeHtml)(input.projectTitle);
        const name = (0, mail_layout_1.escapeHtml)(input.clientName.trim() || 'there');
        const url = `${this.webOrigin}/dashboard/projects/${encodeURIComponent(input.projectId)}`;
        const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Project created</p>
      <p style="margin:0 0 16px 0;">Hi ${name}, your project <strong>${title}</strong> has been saved as a draft.</p>
      ${(0, mail_layout_1.buttonRow)('Open project', url)}
    `;
        const html = (0, mail_layout_1.wrapMail)({
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
    async sendBidPlacedProviderConfirmation(input) {
        const name = (0, mail_layout_1.escapeHtml)(input.providerName.trim() || 'there');
        const pt = (0, mail_layout_1.escapeHtml)(input.projectTitle);
        const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Bid submitted</p>
      <p style="margin:0 0 16px 0;">Hi ${name}, your bid on <strong>${pt}</strong> was submitted successfully.</p>
      <p style="margin:0;font-size:14px;color:#d4d4d4;">Proposed amount: <strong>${(0, mail_layout_1.escapeHtml)(String(input.amount))}</strong></p>
    `;
        const html = (0, mail_layout_1.wrapMail)({
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
    async sendNotificationRich(input) {
        const { heading, subject } = this.notificationHeadingSubject(input.type);
        const msg = (0, mail_layout_1.escapeHtml)(input.message);
        const inner = `
      <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">${(0, mail_layout_1.escapeHtml)(heading)}</p>
      <p style="margin:0 0 16px 0;">${msg}</p>
      ${(0, mail_layout_1.buttonRow)('Open dashboard', `${this.webOrigin}/dashboard`)}
    `;
        const html = (0, mail_layout_1.wrapMail)({ title: subject, preheader: input.message, innerHtml: inner });
        const text = [heading, '', input.message, '', `${this.webOrigin}/dashboard`].join('\n');
        await this.mail.send({ to: input.to, subject, text, html });
    }
    notificationHeadingSubject(type) {
        switch (type) {
            case client_1.NotificationType.NEW_BID:
                return { heading: 'New bid on your project', subject: 'New bid received — HackersDeal' };
            case client_1.NotificationType.BID_ACCEPTED:
                return { heading: 'Your bid was accepted', subject: 'Bid accepted — HackersDeal' };
            case client_1.NotificationType.REPORT_SUBMITTED:
                return { heading: 'New security report', subject: 'New report submitted — HackersDeal' };
            case client_1.NotificationType.REPORT_VALIDATED:
                return { heading: 'Report validated', subject: 'Your report was validated — HackersDeal' };
            case client_1.NotificationType.PAYMENT_RELEASED:
                return { heading: 'Payment released', subject: 'Escrow payment released — HackersDeal' };
            case client_1.NotificationType.BUG_BOUNTY_REPORT_SUBMITTED:
                return { heading: 'New vulnerability submission', subject: 'New bounty submission — HackersDeal' };
            default:
                return { heading: 'HackersDeal update', subject: 'HackersDeal notification' };
        }
    }
};
exports.TransactionalEmailService = TransactionalEmailService;
exports.TransactionalEmailService = TransactionalEmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_mail_service_1.AppMailService,
        config_1.ConfigService])
], TransactionalEmailService);
//# sourceMappingURL=transactional-email.service.js.map