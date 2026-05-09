"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const app_mail_service_1 = require("./app-mail.service");
const notification_email_service_1 = require("./notification-email.service");
const transactional_email_service_1 = require("./transactional-email.service");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Module)({
        providers: [app_mail_service_1.AppMailService, notification_email_service_1.NotificationEmailService, transactional_email_service_1.TransactionalEmailService],
        exports: [app_mail_service_1.AppMailService, notification_email_service_1.NotificationEmailService, transactional_email_service_1.TransactionalEmailService],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map