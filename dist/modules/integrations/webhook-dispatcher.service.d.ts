import { Queue } from 'bullmq';
import { WebhookEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookDeliveryService, type WebhookDeliverJob } from './webhook-delivery.service';
export declare class WebhookDispatcherService {
    private readonly prisma;
    private readonly delivery;
    private readonly webhookQueue;
    private readonly logger;
    constructor(prisma: PrismaService, delivery: WebhookDeliveryService, webhookQueue: Queue<WebhookDeliverJob>);
    dispatch(userId: string, event: WebhookEventType, data: Record<string, unknown>): Promise<void>;
}
