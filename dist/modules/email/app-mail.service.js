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
var AppMailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppMailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
let AppMailService = AppMailService_1 = class AppMailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(AppMailService_1.name);
        this.smtpTransporter = null;
        this.fromAddress = (this.config.get('MAIL_FROM_ADDRESS') ??
            this.config.get('SENDGRID_FROM_EMAIL') ??
            '').trim();
        this.fromName = (this.config.get('MAIL_FROM_NAME') ??
            this.config.get('SENDGRID_FROM_NAME') ??
            'HD Team').trim();
        this.replyTo = (this.config.get('MAIL_REPLY_TO') ?? this.fromAddress).trim();
        const explicit = (this.config.get('MAIL_PROVIDER') ?? 'auto').toLowerCase();
        const hasSmtp = !!this.config.get('GMAIL_SMTP_USER')?.trim() &&
            !!this.config.get('GMAIL_SMTP_APP_PASSWORD')?.trim();
        const hasSendgrid = !!this.config.get('SENDGRID_API_KEY')?.trim();
        if (explicit === 'smtp')
            this.driver = hasSmtp ? 'smtp' : 'none';
        else if (explicit === 'sendgrid')
            this.driver = hasSendgrid ? 'sendgrid' : 'none';
        else {
            if (hasSmtp)
                this.driver = 'smtp';
            else if (hasSendgrid)
                this.driver = 'sendgrid';
            else
                this.driver = 'none';
        }
        if (this.driver === 'smtp') {
            const host = this.config.get('GMAIL_SMTP_HOST') ?? 'smtp.gmail.com';
            const port = Number(this.config.get('GMAIL_SMTP_PORT') ?? '587');
            const user = this.config.get('GMAIL_SMTP_USER').trim();
            const pass = this.config.get('GMAIL_SMTP_APP_PASSWORD').trim();
            this.smtpTransporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
            });
            this.logger.log(`Mail: SMTP (${host}:${port}) as ${user}`);
        }
        else if (this.driver === 'sendgrid') {
            const apiKey = this.config.get('SENDGRID_API_KEY');
            if (apiKey)
                sgMail.setApiKey(apiKey);
            this.logger.log('Mail: SendGrid');
        }
        else {
            this.logger.warn('Mail: disabled (set GMAIL_SMTP_* or SENDGRID_API_KEY, and MAIL_FROM_ADDRESS)');
        }
    }
    isEnabled() {
        return this.driver !== 'none' && !!this.fromAddress;
    }
    fromHeader() {
        if (this.fromName)
            return `${this.fromName} <${this.fromAddress}>`;
        return this.fromAddress;
    }
    async send(input) {
        if (!this.isEnabled()) {
            this.logger.debug(`Skip mail to ${input.to}: mail not configured`);
            return;
        }
        if (!input.to?.trim())
            return;
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
            }
            catch (err) {
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
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.error(`SendGrid send failed: ${message}`);
            }
        }
    }
};
exports.AppMailService = AppMailService;
exports.AppMailService = AppMailService = AppMailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AppMailService);
//# sourceMappingURL=app-mail.service.js.map