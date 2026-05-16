import { Injectable } from '@nestjs/common';
import { PspProviderName, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    sessionId?: string;
    eventType: string;
    provider?: PspProviderName;
    providerEventId?: string;
    actorUserId?: string;
    payload?: Prisma.InputJsonValue;
  }) {
    try {
      return await this.prisma.paymentAuditLog.create({
        data: {
          sessionId: input.sessionId,
          eventType: input.eventType,
          provider: input.provider,
          providerEventId: input.providerEventId,
          actorUserId: input.actorUserId,
          payload: input.payload,
        },
      });
    } catch {
      // Duplicate providerEventId — idempotent webhook replay
      return null;
    }
  }
}
