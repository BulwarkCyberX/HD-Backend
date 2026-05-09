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
var NotificationEmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const sgMail = require("@sendgrid/mail");
let NotificationEmailService = NotificationEmailService_1 = class NotificationEmailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(NotificationEmailService_1.name);
        this.enabled =
            this.config.get('SENDGRID_ENABLED') === 'true' ||
                !!this.config.get('SENDGRID_API_KEY');
        this.fromEmail = this.config.get('SENDGRID_FROM_EMAIL');
        const apiKey = this.config.get('SENDGRID_API_KEY');
        if (apiKey) {
            sgMail.setApiKey(apiKey);
        }
    }
    async sendNotificationEmail(input) {
        if (!this.enabled)
            return;
        if (!input.toEmail)
            return;
        if (!this.fromEmail) {
            this.logger.warn('SendGrid enabled but SENDGRID_FROM_EMAIL is not set');
            return;
        }
        const subject = this.buildSubject(input.type);
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`SendGrid send failed: ${message}`);
        }
    }
    buildSubject(type) {
        switch (type) {
            case client_1.NotificationType.NEW_BID:
                return 'New bid received';
            case client_1.NotificationType.BID_ACCEPTED:
                return 'Your bid was accepted';
            case client_1.NotificationType.REPORT_SUBMITTED:
                return 'New security report submitted';
            case client_1.NotificationType.REPORT_VALIDATED:
                return 'Your report was marked valid';
            case client_1.NotificationType.PAYMENT_RELEASED:
                return 'Escrow payment released';
            case client_1.NotificationType.BUG_BOUNTY_REPORT_SUBMITTED:
                return 'New vulnerability submission received';
            default:
                return 'HackersDeal notification';
        }
    }
};
exports.NotificationEmailService = NotificationEmailService;
exports.NotificationEmailService = NotificationEmailService = NotificationEmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationEmailService);
//# sourceMappingURL=notification-email.service.js.map