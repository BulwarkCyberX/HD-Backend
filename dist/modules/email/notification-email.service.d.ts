import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
type SendNotificationEmailInput = {
    toEmail: string;
    type: NotificationType;
    message: string;
};
export declare class NotificationEmailService {
    private readonly config;
    private readonly logger;
    private readonly enabled;
    private readonly fromEmail?;
    constructor(config: ConfigService);
    sendNotificationEmail(input: SendNotificationEmailInput): Promise<void>;
    private buildSubject;
}
export {};
