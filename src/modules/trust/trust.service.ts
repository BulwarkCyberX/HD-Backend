import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async logModeration(input: {
    actorId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.moderationAuditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
      select: { id: true, createdAt: true },
    });
  }
}
