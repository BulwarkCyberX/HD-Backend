import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomBytes } from 'crypto';
import { WebhookEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookDeliveryService, type WebhookDeliverJob } from './webhook-delivery.service';

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: WebhookDeliveryService,
    @InjectQueue('webhooks') private readonly webhookQueue: Queue<WebhookDeliverJob>,
  ) {}

  async dispatch(userId: string, event: WebhookEventType, data: Record<string, unknown>) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { userId, enabled: true, events: { has: event } },
      select: { id: true },
    });
    if (endpoints.length === 0) return;

    const payload = {
      id: randomBytes(12).toString('hex'),
      event,
      createdAt: new Date().toISOString(),
      data,
    };

    for (const endpoint of endpoints) {
      const job: WebhookDeliverJob = { endpointId: endpoint.id, event, payload, attempt: 1 };
      try {
        await this.webhookQueue.add('deliver', job, {
          attempts: 4,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        });
      } catch (err) {
        this.logger.warn(
          `Webhook queue unavailable, delivering inline: ${err instanceof Error ? err.message : String(err)}`,
        );
        void this.delivery.deliver(job).catch(() => undefined);
      }
    }
  }
}
