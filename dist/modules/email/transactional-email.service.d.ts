import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { AppMailService } from './app-mail.service';
export declare class TransactionalEmailService {
    private readonly mail;
    private readonly config;
    private readonly webOrigin;
    constructor(mail: AppMailService, config: ConfigService);
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
    sendNotificationRich(input: {
        to: string;
        type: NotificationType;
        message: string;
    }): Promise<void>;
    private notificationHeadingSubject;
}
