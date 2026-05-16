import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async adminSummary() {
    const [users, projects, payments, disputes] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.RELEASED } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    ]);
    const platform = await this.prisma.platformWallet.findFirst({
      select: { availableBalance: true, lifetimeEarnings: true, currency: true },
    });
    return {
      users,
      projects,
      releasedPaymentsGross: payments._sum.amount ?? 0,
      activeDisputes: disputes,
      platformWallet: platform
        ? {
            availableBalance: platform.availableBalance.toString(),
            lifetimeEarnings: platform.lifetimeEarnings.toString(),
            currency: platform.currency,
          }
        : null,
    };
  }

  async providerFor(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        rating: true,
        totalReviews: true,
        completedProjects: true,
        validReportCount: true,
        reputationScore: true,
      },
    });
    const bids = await this.prisma.bid.count({ where: { providerId: userId } });
    const wallet = await this.prisma.userWallet.findUnique({
      where: { userId },
      select: {
        availableBalance: true,
        lifetimeEarnings: true,
        escrowBalance: true,
        totalSpent: true,
        currency: true,
      },
    });
    return {
      profile,
      bidsSubmitted: bids,
      wallet: wallet
        ? {
            availableBalance: wallet.availableBalance.toString(),
            lifetimeEarnings: wallet.lifetimeEarnings.toString(),
            escrowBalance: wallet.escrowBalance.toString(),
            totalSpent: wallet.totalSpent.toString(),
            currency: wallet.currency,
          }
        : null,
    };
  }

  async clientFor(userId: string) {
    const projects = await this.prisma.project.count({ where: { clientId: userId } });
    const wallet = await this.prisma.userWallet.findUnique({
      where: { userId },
      select: {
        availableBalance: true,
        escrowBalance: true,
        totalSpent: true,
        currency: true,
      },
    });
    return {
      projectsOwned: projects,
      wallet: wallet
        ? {
            availableBalance: wallet.availableBalance.toString(),
            escrowBalance: wallet.escrowBalance.toString(),
            totalSpent: wallet.totalSpent.toString(),
            currency: wallet.currency,
          }
        : null,
    };
  }
}
