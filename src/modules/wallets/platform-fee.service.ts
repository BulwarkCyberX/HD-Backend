import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformFeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveFeeBps(): Promise<{ clientFeeBps: number; providerFeeBps: number }> {
    const row = await this.prisma.platformFeeConfig.findFirst({
      where: {
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      orderBy: { effectiveFrom: 'desc' },
      select: { clientFeeBps: true, providerFeeBps: true },
    });
    return row ?? { clientFeeBps: 0, providerFeeBps: 0 };
  }
}
