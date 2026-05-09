import { ConfigService } from '@nestjs/config';
export type SendAppMailInput = {
    to: string;
    subject: string;
    text: string;
    html?: string;
};
export declare class AppMailService {
    private readonly config;
    private readonly logger;
    private readonly driver;
    private readonly fromAddress;
    private readonly fromName;
    private readonly replyTo;
    private smtpTransporter;
    constructor(config: ConfigService);
    isEnabled(): boolean;
    private fromHeader;
    send(input: SendAppMailInput): Promise<void>;
}
