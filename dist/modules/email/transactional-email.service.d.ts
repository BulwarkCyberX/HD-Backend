import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { AppMailService } from './app-mail.service';
import { EmailTemplateService } from './email-template.service';
export declare class TransactionalEmailService {
    private readonly mail;
    private readonly config;
    private readonly templates;
    private readonly webOrigin;
    constructor(mail: AppMailService, config: ConfigService, templates: EmailTemplateService);
    sendSignupVerification(input: {
        to: string;
        firstName: string;
        verifyUrl: string;
        otp: string;
        expiresHours: number;
    }): Promise<void>;
    sendEmailVerifiedWelcome(input: {
        to: string;
        firstName: string;
    }): Promise<void>;
    sendLoginOtp(input: {
        to: string;
        code: string;
        ttlMinutes: number;
    }): Promise<void>;
    sendPasswordReset(input: {
        to: string;
        resetUrl: string;
        expiresHours: number;
    }): Promise<void>;
    sendProjectCreated(input: {
        to: string;
        clientName: string;
        projectTitle: string;
        projectId: string;
    }): Promise<void>;
    sendBidPlacedProviderConfirmation(input: {
        to: string;
        providerName: string;
        projectTitle: string;
        amount: number;
    }): Promise<void>;
    sendWeeklyDigest(input: {
        to: string;
        firstName: string;
        items: Array<{
            type: string;
            message: string;
            createdAt: Date;
        }>;
    }): Promise<void>;
    private escapeHtml;
    sendNotificationRich(input: {
        to: string;
        type: NotificationType;
        message: string;
    }): Promise<void>;
    private notificationHeadingSubject;
}
