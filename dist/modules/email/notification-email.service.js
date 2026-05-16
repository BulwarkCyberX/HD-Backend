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
exports.NotificationEmailService = void 0;
const common_1 = require("@nestjs/common");
const app_mail_service_1 = require("./app-mail.service");
const transactional_email_service_1 = require("./transactional-email.service");
let NotificationEmailService = class NotificationEmailService {
    constructor(mail, transactional) {
        this.mail = mail;
        this.transactional = transactional;
    }
    async sendNotificationEmail(input) {
        if (!this.mail.isEnabled())
            return;
        if (!input.toEmail)
            return;
        await this.transactional.sendNotificationRich({
            to: input.toEmail,
            type: input.type,
            message: input.message,
        });
    }
    async sendWeeklyDigestEmail(input) {
        if (!this.mail.isEnabled())
            return;
        if (!input.toEmail)
            return;
        await this.transactional.sendWeeklyDigest({
            to: input.toEmail,
            firstName: input.firstName,
            items: input.items,
        });
    }
};
exports.NotificationEmailService = NotificationEmailService;
exports.NotificationEmailService = NotificationEmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_mail_service_1.AppMailService,
        transactional_email_service_1.TransactionalEmailService])
], NotificationEmailService);
//# sourceMappingURL=notification-email.service.js.map