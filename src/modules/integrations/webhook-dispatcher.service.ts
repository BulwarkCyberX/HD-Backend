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

  async dispatchTest(userId: string, endpointId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, userId, enabled: true },
      select: { id: true, events: true },
    });
    if (!endpoint) return;
    const event = endpoint.events[0] ?? WebhookEventType.BID_ACCEPTED;
    const payload = {
      id: randomBytes(12).toString('hex'),
      event,
      createdAt: new Date().toISOString(),
      data: { test: true, message: 'HackersDeal webhook connectivity test' },
    };
    await this.enqueue(endpoint.id, event, payload);
  }

  async replayDelivery(endpointId: string, event: WebhookEventType, payload: object) {
    const p = payload as {
      id: string;
      event: WebhookEventType;
      createdAt: string;
      data: Record<string, unknown>;
    };
    await this.enqueue(endpointId, event, p);
  }

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
      await this.enqueue(endpoint.id, event, payload);
    }
  }

  private async enqueue(
    endpointId: string,
    event: WebhookEventType,
    payload: WebhookDeliverJob['payload'],
  ) {
    const job: WebhookDeliverJob = { endpointId, event, payload, attempt: 1 };
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
