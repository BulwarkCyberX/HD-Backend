import { WebhookEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export type WebhookDeliverJob = {
    endpointId: string;
    event: WebhookEventType;
    payload: {
        id: string;
        event: WebhookEventType;
        createdAt: string;
        data: Record<string, unknown>;
    };
    attempt: number;
};
export declare class WebhookDeliveryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    deliver(job: WebhookDeliverJob): Promise<{
        success: boolean;
        skipped: boolean;
    } | {
        success: boolean;
        skipped?: undefined;
    }>;
}
