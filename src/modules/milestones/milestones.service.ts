import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MilestoneStatus,
  PaymentStatus,
  Prisma,
  UserRole,
  type PaymentCurrency,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { DomainEventsService } from '../realtime/domain-events.service';

const fundedLike: MilestoneStatus[] = [
  MilestoneStatus.FUNDED,
  MilestoneStatus.IN_PROGRESS,
  MilestoneStatus.SUBMITTED,
  MilestoneStatus.APPROVED,
  MilestoneStatus.RELEASED,
];

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
    private readonly events: DomainEventsService,
  ) {}

  private readonly select = {
    id: true,
    projectId: true,
    title: true,
    description: true,
    sortOrder: true,
    amount: true,
    currency: true,
    status: true,
    partialPercent: true,
    releasedAmount: true,
    fundedAt: true,
    submittedAt: true,
    approvedAt: true,
    releasedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async listByProject(input: { projectId: string; requesterId: string; role: UserRole }) {
    await this.assertParticipant(input.projectId, input.requesterId, input.role);
    return this.prisma.projectMilestone.findMany({
      where: { projectId: input.projectId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: this.select,
    });
  }

  async create(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    title: string;
    description: string;
    amount: number;
    currency: PaymentCurrency;
    sortOrder: number;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create milestones');
    }
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, status: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can add milestones');
    }
    const amountDec = new Prisma.Decimal(String(input.amount));
    const row = await this.prisma.projectMilestone.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        amount: amountDec,
        currency: input.currency,
        sortOrder: input.sortOrder,
        status: MilestoneStatus.PENDING,
      },
      select: this.select,
    });
    this.emitMilestone(row);
    return row;
  }

  async update(input: {
    requesterId: string;
    role: UserRole;
    milestoneId: string;
    title?: string;
    description?: string;
    amount?: number;
    currency?: PaymentCurrency;
  }) {
    if (input.role !== UserRole.CLIENT) throw new ForbiddenException('Only clients can edit milestones');
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertOwner(m.projectId, input.requesterId);
    if (m.status !== MilestoneStatus.PENDING) {
      throw new BadRequestException('Only pending milestones can be edited');
    }
    const row = await this.prisma.projectMilestone.update({
      where: { id: input.milestoneId },
      data: {
        title: input.title,
        description: input.description,
        amount: input.amount !== undefined ? new Prisma.Decimal(String(input.amount)) : undefined,
        currency: input.currency,
      },
      select: this.select,
    });
    this.emitMilestone(row);
    return row;
  }

  async remove(input: { requesterId: string; role: UserRole; milestoneId: string }) {
    if (input.role !== UserRole.CLIENT) throw new ForbiddenException('Only clients can delete milestones');
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertOwner(m.projectId, input.requesterId);
    if (m.status !== MilestoneStatus.PENDING) {
      throw new BadRequestException('Only pending milestones can be deleted');
    }
    await this.prisma.projectMilestone.delete({ where: { id: input.milestoneId } });
    return { ok: true as const };
  }

  async fund(input: { requesterId: string; role: UserRole; milestoneId: string }) {
    if (input.role !== UserRole.CLIENT) throw new ForbiddenException('Only clients can fund milestones');
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertOwner(m.projectId, input.requesterId);
    if (m.status !== MilestoneStatus.PENDING) {
      throw new BadRequestException('Milestone is not pending');
    }
    const project = await this.prisma.project.findUnique({
      where: { id: m.projectId },
      select: { clientId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const payment = await this.prisma.payment.findUnique({
      where: { projectId: m.projectId },
      select: { amount: true, status: true, currency: true },
    });
    if (!payment || payment.status !== PaymentStatus.IN_ESCROW) {
      throw new BadRequestException('Project must have an active escrow payment before funding milestones');
    }
    const payCap = new Prisma.Decimal(String(payment.amount));
    const allocated = await this.sumAllocated(m.projectId);
    const next = allocated.add(m.amount);
    if (next.gt(payCap)) {
      throw new BadRequestException('Total funded milestones would exceed escrow payment amount');
    }

    const funded = await this.prisma.$transaction(async (tx) => {
      const row = await tx.projectMilestone.update({
        where: { id: input.milestoneId },
        data: { status: MilestoneStatus.FUNDED, fundedAt: new Date() },
        select: this.select,
      });
      await this.wallets.recordMilestoneFundLedgerTx(tx, {
        clientUserId: project.clientId,
        projectId: m.projectId,
        milestoneId: m.id,
        amount: m.amount,
        currency: m.currency,
        actorUserId: input.requesterId,
      });
      return row;
    });
    this.emitMilestone(funded);
    return funded;
  }

  async startProgress(input: { requesterId: string; role: UserRole; milestoneId: string }) {
    if (input.role !== UserRole.PROVIDER) throw new ForbiddenException('Only providers can start milestone work');
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertSelectedProvider(m.projectId, input.requesterId);
    if (m.status !== MilestoneStatus.FUNDED) {
      throw new BadRequestException('Milestone must be funded before work starts');
    }
    const row = await this.prisma.projectMilestone.update({
      where: { id: input.milestoneId },
      data: { status: MilestoneStatus.IN_PROGRESS },
      select: this.select,
    });
    this.emitMilestone(row);
    return row;
  }

  async submit(input: { requesterId: string; role: UserRole; milestoneId: string }) {
    if (input.role !== UserRole.PROVIDER) throw new ForbiddenException('Only providers can submit milestones');
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertSelectedProvider(m.projectId, input.requesterId);
    if (m.status !== MilestoneStatus.FUNDED && m.status !== MilestoneStatus.IN_PROGRESS) {
      throw new BadRequestException('Milestone cannot be submitted from this state');
    }
    const row = await this.prisma.projectMilestone.update({
      where: { id: input.milestoneId },
      data: { status: MilestoneStatus.SUBMITTED, submittedAt: new Date() },
      select: this.select,
    });
    this.emitMilestone(row);
    return row;
  }

  async approve(input: { requesterId: string; role: UserRole; milestoneId: string; partialPercent?: number }) {
    if (input.role !== UserRole.CLIENT) throw new ForbiddenException('Only clients can approve milestones');
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertOwner(m.projectId, input.requesterId);
    if (m.status !== MilestoneStatus.SUBMITTED) {
      throw new BadRequestException('Milestone must be submitted before approval');
    }
    const partial = input.partialPercent ?? 100;
    if (partial < 1 || partial > 100) throw new BadRequestException('partialPercent must be 1–100');
    const releasedAmount = m.amount.mul(new Prisma.Decimal(partial)).div(100);
    const row = await this.prisma.projectMilestone.update({
      where: { id: input.milestoneId },
      data: {
        status: MilestoneStatus.APPROVED,
        approvedAt: new Date(),
        partialPercent: partial,
        releasedAmount,
      },
      select: this.select,
    });
    this.emitMilestone(row);
    return row;
  }

  async release(input: { requesterId: string; role: UserRole; milestoneId: string }) {
    if (input.role !== UserRole.CLIENT) throw new ForbiddenException('Only clients can release milestone funds');
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertOwner(m.projectId, input.requesterId);
    if (m.status !== MilestoneStatus.APPROVED) {
      throw new BadRequestException('Milestone must be approved before release');
    }
    const gross = m.releasedAmount ?? m.amount;
    const project = await this.prisma.project.findUnique({
      where: { id: m.projectId },
      select: { clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const providerId = project.selectedProviderId;
    if (!providerId) throw new BadRequestException('Project has no selected provider');

    const released = await this.prisma.$transaction(async (tx) => {
      const row = await tx.projectMilestone.update({
        where: { id: input.milestoneId },
        data: { status: MilestoneStatus.RELEASED, releasedAt: new Date() },
        select: this.select,
      });
      await this.wallets.recordMilestoneReleaseTx(tx, {
        clientUserId: project.clientId,
        providerUserId: providerId,
        projectId: m.projectId,
        milestoneId: m.id,
        grossAmount: gross,
        currency: m.currency,
        actorUserId: input.requesterId,
      });
      return row;
    });
    this.emitMilestone(released);
    return released;
  }

  async reject(input: { requesterId: string; role: UserRole; milestoneId: string }) {
    if (input.role !== UserRole.CLIENT) throw new ForbiddenException('Only clients can reject milestones');
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertOwner(m.projectId, input.requesterId);
    if (m.status === MilestoneStatus.SUBMITTED) {
      const row = await this.prisma.projectMilestone.update({
        where: { id: input.milestoneId },
        data: { status: MilestoneStatus.IN_PROGRESS, submittedAt: null },
        select: this.select,
      });
      this.emitMilestone(row);
      return row;
    }
    if (m.status === MilestoneStatus.FUNDED) {
      const row = await this.prisma.projectMilestone.update({
        where: { id: input.milestoneId },
        data: {
          status: MilestoneStatus.PENDING,
          fundedAt: null,
          partialPercent: null,
          releasedAmount: null,
        },
        select: this.select,
      });
      this.emitMilestone(row);
      return row;
    }
    throw new BadRequestException('Milestone cannot be rejected from this state');
  }

  async listComments(input: { milestoneId: string; requesterId: string; role: UserRole }) {
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertParticipant(m.projectId, input.requesterId, input.role);
    return this.prisma.milestoneComment.findMany({
      where: { milestoneId: input.milestoneId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async addComment(input: { milestoneId: string; requesterId: string; role: UserRole; body: string }) {
    const m = await this.getMilestoneOrThrow(input.milestoneId);
    await this.assertParticipant(m.projectId, input.requesterId, input.role);
    return this.prisma.milestoneComment.create({
      data: {
        milestoneId: input.milestoneId,
        authorId: input.requesterId,
        body: input.body,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, email: true, role: true } },
      },
    });
  }

  private serializeMilestone(row: {
    id: string;
    projectId: string;
    title: string;
    description: string;
    sortOrder: number;
    amount: Prisma.Decimal;
    currency: string;
    status: MilestoneStatus;
    partialPercent: number | null;
    releasedAmount: Prisma.Decimal | null;
    fundedAt: Date | null;
    submittedAt: Date | null;
    approvedAt: Date | null;
    releasedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...row,
      amount: row.amount.toString(),
      releasedAmount: row.releasedAmount?.toString() ?? null,
    };
  }

  private emitMilestone(row: {
    projectId: string;
    id: string;
    title: string;
    description: string;
    sortOrder: number;
    amount: Prisma.Decimal;
    currency: string;
    status: MilestoneStatus;
    partialPercent: number | null;
    releasedAmount: Prisma.Decimal | null;
    fundedAt: Date | null;
    submittedAt: Date | null;
    approvedAt: Date | null;
    releasedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.events.milestoneUpdated({
      projectId: row.projectId,
      milestone: this.serializeMilestone(row),
    });
  }

  private async sumAllocated(projectId: string): Promise<Prisma.Decimal> {
    const agg = await this.prisma.projectMilestone.aggregate({
      where: { projectId, status: { in: fundedLike } },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? new Prisma.Decimal(0);
  }

  private async getMilestoneOrThrow(id: string) {
    const m = await this.prisma.projectMilestone.findUnique({
      where: { id },
      select: this.select,
    });
    if (!m) throw new NotFoundException('Milestone not found');
    return m;
  }

  private async assertParticipant(projectId: string, userId: string, role: UserRole) {
    const p = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, selectedProviderId: true },
    });
    if (!p) throw new NotFoundException('Project not found');
    if (role === UserRole.ADMIN) return;
    if (p.clientId === userId || p.selectedProviderId === userId) return;
    throw new ForbiddenException('Not a project participant');
  }

  private async assertOwner(projectId: string, userId: string) {
    const p = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    if (!p) throw new NotFoundException('Project not found');
    if (p.clientId !== userId) throw new ForbiddenException('Only project owner can perform this action');
  }

  private async assertSelectedProvider(projectId: string, userId: string) {
    const p = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { selectedProviderId: true },
    });
    if (!p?.selectedProviderId || p.selectedProviderId !== userId) {
      throw new ForbiddenException('Only the selected provider can perform this action');
    }
  }
}
