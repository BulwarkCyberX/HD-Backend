import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
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

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deliver(job: WebhookDeliverJob) {
    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id: job.endpointId },
      select: { id: true, url: true, secret: true, enabled: true },
    });
    if (!endpoint?.enabled) {
      return { success: true, skipped: true };
    }

    const body = JSON.stringify(job.payload);
    const signature = createHmac('sha256', endpoint.secret).update(body).digest('hex');

    let statusCode: number | null = null;
    let success = false;
    let errorMessage: string | null = null;

    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HackersDeal-Event': job.event,
          'X-HackersDeal-Signature': `sha256=${signature}`,
          'X-HackersDeal-Delivery-Attempt': String(job.attempt),
        },
        body,
        signal: AbortSignal.timeout(12_000),
      });
      statusCode = res.status;
      success = res.ok;
      if (!res.ok) {
        errorMessage = `HTTP ${res.status}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Webhook ${endpoint.id} attempt ${job.attempt} failed: ${errorMessage}`,
      );
      await this.prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event: job.event,
          payload: { ...job.payload, attempt: job.attempt } as object,
          statusCode: statusCode ?? undefined,
          success: false,
          errorMessage,
        },
      });
      throw err;
    }

    await this.prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        event: job.event,
        payload: { ...job.payload, attempt: job.attempt } as object,
        statusCode: statusCode ?? undefined,
        success: true,
      },
    });

    return { success: true };
  }
}
