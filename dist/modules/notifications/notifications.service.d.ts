import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationEmailService } from '../email/notification-email.service';
import { DomainEventsService } from '../realtime/domain-events.service';
export declare class NotificationsService {
    private readonly prisma;
    private readonly notificationEmail;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, notificationEmail: NotificationEmailService, events: DomainEventsService);
    create(input: {
        userId: string;
        type: NotificationType;
        message: string;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        read: boolean;
    }>;
    private trySendNotificationEmail;
    listForUser(userId: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        read: boolean;
    }[]>;
    markRead(input: {
        id: string;
        userId: string;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        read: boolean;
    }>;
    sendWeeklyDigests(): Promise<{
        sent: number;
        since: string;
    }>;
}
