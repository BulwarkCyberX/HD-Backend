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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_email_service_1 = require("../email/notification-email.service");
const domain_events_service_1 = require("../realtime/domain-events.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, notificationEmail, events) {
        this.prisma = prisma;
        this.notificationEmail = notificationEmail;
        this.events = events;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async create(input) {
        const created = await this.prisma.notification.create({
            data: { userId: input.userId, type: input.type, message: input.message },
        });
        this.events.notificationCreated({ userId: input.userId, notification: created });
        void this.trySendNotificationEmail(input);
        return created;
    }
    async trySendNotificationEmail(input) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: input.userId },
                select: { email: true },
            });
            if (!user?.email)
                return;
            await this.notificationEmail.sendNotificationEmail({
                toEmail: user.email,
                type: input.type,
                message: input.message,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Notification email failed: ${message}`);
        }
    }
    async listForUser(userId) {
        return await this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async markRead(input) {
        const existing = await this.prisma.notification.findFirst({
            where: { id: input.id, userId: input.userId },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Notification not found');
        return await this.prisma.notification.update({
            where: { id: input.id },
            data: { read: true },
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_email_service_1.NotificationEmailService,
        domain_events_service_1.DomainEventsService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map