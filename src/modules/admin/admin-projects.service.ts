import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ProjectStatus,
  ProjectVisibility,
  UserRole,
  type BudgetType,
  type PaymentCurrency,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly projectSelect = {
    id: true,
    title: true,
    description: true,
    assets: true,
    inScope: true,
    outOfScope: true,
    testingWindow: true,
    budgetType: true,
    budgetAmount: true,
    timeline: true,
    visibility: true,
    status: true,
    clientId: true,
    selectedProviderId: true,
    createdAt: true,
    client: { select: { id: true, email: true, firstName: true, lastName: true } },
    selectedProvider: {
      select: { id: true, email: true, providerProfile: { select: { rating: true, reputationScore: true } } },
    },
    payment: { select: { id: true, amount: true, currency: true, status: true } },
    _count: { select: { bids: true, reports: true, milestones: true, disputes: true } },
  } as const;

  async list(input: { status?: ProjectStatus; visibility?: ProjectVisibility; q?: string }) {
    const q = input.q?.trim();
    return this.prisma.project.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.visibility ? { visibility: input.visibility } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { client: { email: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: this.projectSelect,
    });
  }

  async getById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ...this.projectSelect,
        bids: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            proposal: true,
            price: true,
            timeline: true,
            status: true,
            createdAt: true,
            provider: { select: { id: true, email: true } },
          },
        },
        milestones: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            sortOrder: true,
          },
        },
        disputes: {
          select: { id: true, title: true, status: true, category: true, createdAt: true },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(
    projectId: string,
    input: {
      title?: string;
      description?: string;
      status?: ProjectStatus;
      visibility?: ProjectVisibility;
      budgetType?: BudgetType;
      budgetAmount?: number;
      timeline?: string;
      testingWindow?: string;
      inScope?: string[];
      outOfScope?: string[];
      selectedProviderId?: string | null;
    },
  ) {
    const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) throw new NotFoundException('Project not found');

    if (input.selectedProviderId) {
      const bid = await this.prisma.bid.findFirst({
        where: { projectId, providerId: input.selectedProviderId, status: 'ACCEPTED' },
      });
      if (!bid && input.selectedProviderId !== existing.selectedProviderId) {
        const anyBid = await this.prisma.bid.findFirst({
          where: { projectId, providerId: input.selectedProviderId },
        });
        if (!anyBid) {
          throw new BadRequestException('Selected provider must have a bid on this project');
        }
      }
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        visibility: input.visibility,
        budgetType: input.budgetType,
        budgetAmount: input.budgetAmount,
        timeline: input.timeline,
        testingWindow: input.testingWindow,
        inScope: input.inScope,
        outOfScope: input.outOfScope,
        selectedProviderId: input.selectedProviderId,
      },
      select: this.projectSelect,
    });
  }

  async getFinancials(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, payment: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const [checkouts, ledger, clientWallet] = await Promise.all([
      this.prisma.pspCheckoutSession.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          provider: true,
          status: true,
          providerOrderId: true,
          providerPaymentId: true,
          paidAt: true,
          createdAt: true,
        },
      }),
      this.prisma.walletLedgerEntry.findMany({
        where: { referenceId: { in: [projectId, project.payment?.id ?? ''].filter(Boolean) } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          referenceId: true,
          createdAt: true,
        },
      }),
      this.prisma.userWallet.findUnique({
        where: { userId: project.clientId },
        select: {
          escrowBalance: true,
          availableBalance: true,
          totalSpent: true,
          currency: true,
        },
      }),
    ]);

    return {
      payment: project.payment,
      checkouts,
      ledger,
      clientWallet: clientWallet
        ? {
            escrowBalance: clientWallet.escrowBalance.toString(),
            availableBalance: clientWallet.availableBalance.toString(),
            totalSpent: clientWallet.totalSpent.toString(),
            currency: clientWallet.currency,
          }
        : null,
    };
  }

  assertAdmin(role: UserRole) {
    if (role !== UserRole.ADMIN) throw new BadRequestException('Admin only');
  }
}
