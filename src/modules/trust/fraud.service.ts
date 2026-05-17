import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const BID_VELOCITY_LIMIT_PER_HOUR = 20;
const REPORT_VELOCITY_LIMIT_PER_HOUR = 15;

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkBidVelocity(providerId: string) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.bid.count({
      where: { providerId, createdAt: { gte: since } },
    });
    if (count > BID_VELOCITY_LIMIT_PER_HOUR) {
      await this.flagUser(providerId, 'HIGH_BID_VELOCITY', {
        bidsLastHour: count,
        limit: BID_VELOCITY_LIMIT_PER_HOUR,
      });
      this.logger.warn(`Fraud flag: provider ${providerId} bid velocity ${count}/h`);
    }
    return count;
  }

  async checkReportVelocity(providerId: string) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.report.count({
      where: { submittedBy: providerId, createdAt: { gte: since } },
    });
    if (count > REPORT_VELOCITY_LIMIT_PER_HOUR) {
      await this.flagUser(providerId, 'HIGH_REPORT_VELOCITY', {
        reportsLastHour: count,
        limit: REPORT_VELOCITY_LIMIT_PER_HOUR,
      });
    }
    return count;
  }

  async listFlaggedUsers(limit = 50) {
    return this.prisma.fraudFlag.findMany({
      where: { score: { gte: 10 } },
      orderBy: { score: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        score: true,
        reasons: true,
        updatedAt: true,
        user: { select: { email: true, role: true } },
      },
    });
  }

  private async flagUser(userId: string, reason: string, detail: Record<string, unknown>) {
    const existing = await this.prisma.fraudFlag.findUnique({ where: { userId } });
    const reasons = (existing?.reasons as { entries?: unknown[] } | null)?.entries ?? [];
    const nextReasons = [...(Array.isArray(reasons) ? reasons : []), { reason, detail, at: new Date().toISOString() }];

    await this.prisma.fraudFlag.upsert({
      where: { userId },
      create: {
        userId,
        score: 10,
        reasons: { entries: nextReasons } as Prisma.InputJsonValue,
      },
      update: {
        score: { increment: 5 },
        reasons: { entries: nextReasons.slice(-20) } as Prisma.InputJsonValue,
      },
    });
  }
}
