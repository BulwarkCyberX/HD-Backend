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
const email_template_service_1 = require("./email-template.service");
let TransactionalEmailService = class TransactionalEmailService {
    constructor(mail, config, templates) {
        this.mail = mail;
        this.config = config;
        this.templates = templates;
        this.webOrigin = (this.config.get('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');
    }
    async sendSignupVerification(input) {
        const { subject, html, text } = await this.templates.render('SIGNUP_VERIFICATION', {
            firstName: input.firstName.trim() || 'there',
            email: input.to,
            otp: input.otp,
            verifyUrl: input.verifyUrl,
            expiresHours: String(input.expiresHours),
        });
        await this.mail.send({ to: input.to, subject, text, html });
    }
    async sendEmailVerifiedWelcome(input) {
        const { subject, html, text } = await this.templates.render('EMAIL_VERIFIED_WELCOME', {
            firstName: input.firstName.trim() || 'there',
            loginUrl: `${this.webOrigin}/auth/login`,
        });
        await this.mail.send({ to: input.to, subject, text, html });
    }
    async sendLoginOtp(input) {
        const { subject, html, text } = await this.templates.render('LOGIN_OTP', {
            code: input.code,
            ttlMinutes: String(input.ttlMinutes),
        });
        await this.mail.send({ to: input.to, subject, text, html });
    }
    async sendPasswordReset(input) {
        const { subject, html, text } = await this.templates.render('PASSWORD_RESET', {
            resetUrl: input.resetUrl,
            expiresHours: String(input.expiresHours),
        });
        await this.mail.send({ to: input.to, subject, text, html });
    }
    async sendProjectCreated(input) {
        const { subject, html, text } = await this.templates.render('PROJECT_CREATED', {
            clientName: input.clientName.trim() || 'there',
            projectTitle: input.projectTitle,
            projectUrl: `${this.webOrigin}/dashboard/projects/${encodeURIComponent(input.projectId)}`,
        });
        await this.mail.send({ to: input.to, subject, text, html });
    }
    async sendBidPlacedProviderConfirmation(input) {
        const { subject, html, text } = await this.templates.render('BID_PLACED_PROVIDER', {
            providerName: input.providerName.trim() || 'there',
            projectTitle: input.projectTitle,
            amount: String(input.amount),
        });
        await this.mail.send({ to: input.to, subject, text, html });
    }
    async sendWeeklyDigest(input) {
        const digestHtml = input.items
            .map((item) => `<p style="margin:0 0 8px 0;"><strong>${this.escapeHtml(item.type)}</strong> — ${this.escapeHtml(item.message)}<br/><span style="font-size:12px;color:#a3a3a3;">${item.createdAt.toISOString().slice(0, 10)}</span></p>`)
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
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    async sendNotificationRich(input) {
        const { heading, subject } = this.notificationHeadingSubject(input.type);
        const { html, text } = await this.templates.render('NOTIFICATION_GENERIC', {
            heading,
            message: input.message,
            dashboardUrl: `${this.webOrigin}/dashboard`,
            subject,
        });
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
        config_1.ConfigService,
        email_template_service_1.EmailTemplateService])
], TransactionalEmailService);
//# sourceMappingURL=transactional-email.service.js.map