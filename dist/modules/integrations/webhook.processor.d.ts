import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhookDeliveryService, type WebhookDeliverJob } from './webhook-delivery.service';
export declare class WebhookProcessor extends WorkerHost {
    private readonly delivery;
    private readonly logger;
    constructor(delivery: WebhookDeliveryService);
    process(job: Job<WebhookDeliverJob>): Promise<{
        success: boolean;
        skipped: boolean;
    } | {
        success: boolean;
        skipped?: undefined;
    }>;
}
