import { WebhookEventType } from '@prisma/client';
export declare class CreateWebhookDto {
    label: string;
    url: string;
    events: WebhookEventType[];
}
