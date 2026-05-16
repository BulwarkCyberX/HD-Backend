import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebhookDeliveryService, type WebhookDeliverJob } from './webhook-delivery.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly delivery: WebhookDeliveryService) {
    super();
  }

  async process(job: Job<WebhookDeliverJob>) {
    this.logger.debug(`Processing webhook job ${job.id} attempt ${job.attemptsMade + 1}`);
    return this.delivery.deliver({
      ...job.data,
      attempt: job.attemptsMade + 1,
    });
  }
}
