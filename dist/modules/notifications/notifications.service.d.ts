import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationEmailService } from '../email/notification-email.service';
export declare class NotificationsService {
    private readonly prisma;
    private readonly notificationEmail;
    private readonly logger;
    constructor(prisma: PrismaService, notificationEmail: NotificationEmailService);
    create(input: {
        userId: string;
        type: NotificationType;
        message: string;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        userId: string;
        read: boolean;
    }>;
    private trySendNotificationEmail;
    listForUser(userId: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        userId: string;
        read: boolean;
    }[]>;
    markRead(input: {
        id: string;
        userId: string;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        userId: string;
        read: boolean;
    }>;
}
