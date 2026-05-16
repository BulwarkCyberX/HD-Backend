import { type RequestUser } from '../../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(user: RequestUser): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        read: boolean;
    }[]>;
    markRead(user: RequestUser, id: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        read: boolean;
    }>;
}
