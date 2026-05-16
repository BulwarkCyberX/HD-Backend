import { NotificationType } from '@prisma/client';
import { AppMailService } from './app-mail.service';
import { TransactionalEmailService } from './transactional-email.service';
type SendNotificationEmailInput = {
    toEmail: string;
    type: NotificationType;
    message: string;
};
export declare class NotificationEmailService {
    private readonly mail;
    private readonly transactional;
    constructor(mail: AppMailService, transactional: TransactionalEmailService);
    sendNotificationEmail(input: SendNotificationEmailInput): Promise<void>;
    sendWeeklyDigestEmail(input: {
        toEmail: string;
        firstName: string;
        items: Array<{
            type: string;
            message: string;
            createdAt: Date;
        }>;
    }): Promise<void>;
}
export {};
