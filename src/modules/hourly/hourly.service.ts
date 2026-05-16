import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BudgetType,
  HourlyEngagementStatus,
  PaymentStatus,
  Prisma,
  TimeEntryStatus,
  UserRole,
  type PaymentCurrency,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';

const entrySelect = {
  id: true,
  engagementId: true,
  providerId: true,
  workDate: true,
  hours: true,
  description: true,
  status: true,
  submittedAt: true,
  approvedAt: true,
  rejectedReason: true,
  billedAt: true,
  billedAmount: true,
  createdAt: true,
  updatedAt: true,
} as const;

const engagementSelect = {
  id: true,
  projectId: true,
  hourlyRate: true,
  currency: true,
  weeklyCapHours: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  timeEntries: { select: entrySelect, orderBy: { workDate: 'desc' as const } },
} as const;

@Injectable()
export class HourlyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
  ) {}

  async ensureEngagementForProject(input: {
    projectId: string;
    hourlyRate: number;
    currency?: PaymentCurrency;
    weeklyCapHours?: number;
  }) {
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, budgetType: true },
    });
    if (!project || project.budgetType !== BudgetType.HOURLY) return null;

    const existing = await this.prisma.hourlyEngagement.findUnique({
      where: { projectId: input.projectId },
      select: { id: true },
    });
    if (existing) return existing;

    return this.prisma.hourlyEngagement.create({
      data: {
        projectId: input.projectId,
        hourlyRate: new Prisma.Decimal(String(input.hourlyRate)),
        currency: input.currency ?? 'INR',
        weeklyCapHours: input.weeklyCapHours ?? 40,
      },
      select: engagementSelect,
    });
  }

  async getByProject(input: { projectId: string; requesterId: string; role: UserRole }) {
    await this.assertParticipant(input.projectId, input.requesterId, input.role);
    const row = await this.prisma.hourlyEngagement.findUnique({
      where: { projectId: input.projectId },
      select: engagementSelect,
    });
    if (!row) throw new NotFoundException('Hourly engagement not configured for this project');
    return row;
  }

  async upsertEngagement(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    hourlyRate: number;
    weeklyCapHours?: number;
    currency?: PaymentCurrency;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can configure hourly engagement');
    }
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { clientId: true, budgetType: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can configure hourly engagement');
    }
    if (project.budgetType !== BudgetType.HOURLY) {
      throw new BadRequestException('Project is not hourly');
    }
    if (!project.selectedProviderId) {
      throw new BadRequestException('Assign a provider before configuring hourly billing');
    }

    return this.prisma.hourlyEngagement.upsert({
      where: { projectId: input.projectId },
      create: {
        projectId: input.projectId,
        hourlyRate: new Prisma.Decimal(String(input.hourlyRate)),
        currency: input.currency ?? 'INR',
        weeklyCapHours: input.weeklyCapHours ?? 40,
      },
      update: {
        hourlyRate: new Prisma.Decimal(String(input.hourlyRate)),
        ...(input.weeklyCapHours !== undefined ? { weeklyCapHours: input.weeklyCapHours } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
      },
      select: engagementSelect,
    });
  }

  async createTimeEntry(input: {
    requesterId: string;
    role: UserRole;
    engagementId: string;
    workDate: string;
    hours: number;
    description: string;
  }) {
    if (input.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can log time');
    }
    const engagement = await this.getEngagementOrThrow(input.engagementId);
    await this.assertSelectedProvider(engagement.projectId, input.requesterId);
    if (engagement.status !== HourlyEngagementStatus.ACTIVE) {
      throw new BadRequestException('Hourly engagement is not active');
    }

    return this.prisma.timeEntry.create({
      data: {
        engagementId: input.engagementId,
        providerId: input.requesterId,
        workDate: new Date(input.workDate),
        hours: new Prisma.Decimal(String(input.hours)),
        description: input.description,
        status: TimeEntryStatus.DRAFT,
      },
      select: entrySelect,
    });
  }

  async updateTimeEntry(input: {
    requesterId: string;
    role: UserRole;
    entryId: string;
    workDate?: string;
    hours?: number;
    description?: string;
  }) {
    if (input.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can edit time entries');
    }
    const entry = await this.getEntryOrThrow(input.entryId);
    if (entry.providerId !== input.requesterId) {
      throw new ForbiddenException('Not your time entry');
    }
    if (entry.status !== TimeEntryStatus.DRAFT) {
      throw new BadRequestException('Only draft entries can be edited');
    }

    return this.prisma.timeEntry.update({
      where: { id: input.entryId },
      data: {
        workDate: input.workDate ? new Date(input.workDate) : undefined,
        hours: input.hours !== undefined ? new Prisma.Decimal(String(input.hours)) : undefined,
        description: input.description,
      },
      select: entrySelect,
    });
  }

  async submitTimeEntry(input: { requesterId: string; role: UserRole; entryId: string }) {
    if (input.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can submit time entries');
    }
    const entry = await this.getEntryOrThrow(input.entryId);
    if (entry.providerId !== input.requesterId) {
      throw new ForbiddenException('Not your time entry');
    }
    if (entry.status !== TimeEntryStatus.DRAFT) {
      throw new BadRequestException('Only draft entries can be submitted');
    }

    const engagement = await this.getEngagementOrThrow(entry.engagementId);
    await this.assertWeeklyCap(engagement.id, engagement.weeklyCapHours, entry.workDate, entry.hours);

    return this.prisma.timeEntry.update({
      where: { id: input.entryId },
      data: { status: TimeEntryStatus.SUBMITTED, submittedAt: new Date(), rejectedReason: null },
      select: entrySelect,
    });
  }

  async approveTimeEntry(input: { requesterId: string; role: UserRole; entryId: string }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can approve time entries');
    }
    const entry = await this.getEntryOrThrow(input.entryId);
    const engagement = await this.getEngagementOrThrow(entry.engagementId);
    await this.assertOwner(engagement.projectId, input.requesterId);
    if (entry.status !== TimeEntryStatus.SUBMITTED) {
      throw new BadRequestException('Entry must be submitted before approval');
    }

    return this.prisma.timeEntry.update({
      where: { id: input.entryId },
      data: {
        status: TimeEntryStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: input.requesterId,
        rejectedReason: null,
      },
      select: entrySelect,
    });
  }

  async rejectTimeEntry(input: {
    requesterId: string;
    role: UserRole;
    entryId: string;
    reason?: string;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can reject time entries');
    }
    const entry = await this.getEntryOrThrow(input.entryId);
    const engagement = await this.getEngagementOrThrow(entry.engagementId);
    await this.assertOwner(engagement.projectId, input.requesterId);
    if (entry.status !== TimeEntryStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted entries can be rejected');
    }

    return this.prisma.timeEntry.update({
      where: { id: input.entryId },
      data: {
        status: TimeEntryStatus.DRAFT,
        rejectedReason: input.reason ?? 'Rejected by client',
        submittedAt: null,
        approvedAt: null,
        approvedById: null,
      },
      select: entrySelect,
    });
  }

  async setEngagementStatus(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    status: HourlyEngagementStatus;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can change engagement status');
    }
    await this.assertOwner(input.projectId, input.requesterId);
    const row = await this.prisma.hourlyEngagement.findUnique({
      where: { projectId: input.projectId },
    });
    if (!row) throw new NotFoundException('Hourly engagement not found');
    return this.prisma.hourlyEngagement.update({
      where: { projectId: input.projectId },
      data: { status: input.status },
      select: engagementSelect,
    });
  }

  async getProjectSummary(input: { projectId: string; requesterId: string; role: UserRole }) {
    await this.assertParticipant(input.projectId, input.requesterId, input.role);
    const engagement = await this.prisma.hourlyEngagement.findUnique({
      where: { projectId: input.projectId },
      include: { timeEntries: true },
    });
    if (!engagement) throw new NotFoundException('Hourly engagement not configured');

    const rate = engagement.hourlyRate;
    let draftHours = new Prisma.Decimal(0);
    let submittedHours = new Prisma.Decimal(0);
    let approvedHours = new Prisma.Decimal(0);
    let billedHours = new Prisma.Decimal(0);
    let billedAmount = new Prisma.Decimal(0);

    for (const e of engagement.timeEntries) {
      if (e.status === TimeEntryStatus.DRAFT) draftHours = draftHours.add(e.hours);
      if (e.status === TimeEntryStatus.SUBMITTED) submittedHours = submittedHours.add(e.hours);
      if (e.status === TimeEntryStatus.APPROVED) approvedHours = approvedHours.add(e.hours);
      if (e.status === TimeEntryStatus.BILLED) {
        billedHours = billedHours.add(e.hours);
        billedAmount = billedAmount.add(e.billedAmount ?? rate.mul(e.hours));
      }
    }

    const pendingHours = submittedHours.add(approvedHours);
    const pendingAmount = pendingHours.mul(rate);

    return {
      projectId: input.projectId,
      hourlyRate: rate,
      currency: engagement.currency,
      engagementStatus: engagement.status,
      weeklyCapHours: engagement.weeklyCapHours,
      draftHours: draftHours.toNumber(),
      submittedHours: submittedHours.toNumber(),
      approvedHours: approvedHours.toNumber(),
      billedHours: billedHours.toNumber(),
      billedAmount: billedAmount.toNumber(),
      pendingAmount: pendingAmount.toNumber(),
      entryCount: engagement.timeEntries.length,
    };
  }

  async billTimeEntry(input: { requesterId: string; role: UserRole; entryId: string }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can bill time entries');
    }
    const entry = await this.getEntryOrThrow(input.entryId);
    const engagement = await this.getEngagementOrThrow(entry.engagementId);
    await this.assertOwner(engagement.projectId, input.requesterId);
    if (entry.status !== TimeEntryStatus.APPROVED) {
      throw new BadRequestException('Entry must be approved before billing');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: engagement.projectId },
      select: {
        clientId: true,
        selectedProviderId: true,
        payment: { select: { status: true, amount: true, currency: true } },
      },
    });
    if (!project?.selectedProviderId) {
      throw new BadRequestException('Project has no selected provider');
    }
    if (project.payment?.status !== PaymentStatus.IN_ESCROW) {
      throw new BadRequestException('Project escrow must be funded before billing hours');
    }

    const gross = engagement.hourlyRate.mul(entry.hours);
    const alreadyBilled = await this.sumBilledAmount(engagement.id);
    const escrowAmount = new Prisma.Decimal(String(project.payment.amount));
    if (alreadyBilled.add(gross).gt(escrowAmount)) {
      throw new BadRequestException('Billing would exceed project escrow balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.timeEntry.update({
        where: { id: input.entryId },
        data: {
          status: TimeEntryStatus.BILLED,
          billedAt: new Date(),
          billedAmount: gross,
        },
        select: entrySelect,
      });

      await this.wallets.recordMilestoneReleaseTx(tx, {
        clientUserId: project.clientId,
        providerUserId: project.selectedProviderId!,
        projectId: engagement.projectId,
        milestoneId: row.id,
        grossAmount: gross,
        currency: engagement.currency,
        actorUserId: input.requesterId,
      });

      return row;
    });
  }

  private async sumBilledAmount(engagementId: string) {
    const rows = await this.prisma.timeEntry.findMany({
      where: { engagementId, status: TimeEntryStatus.BILLED },
      select: { billedAmount: true },
    });
    return rows.reduce((acc, r) => acc.add(r.billedAmount ?? new Prisma.Decimal(0)), new Prisma.Decimal(0));
  }

  private async assertWeeklyCap(
    engagementId: string,
    weeklyCapHours: number,
    workDate: Date,
    newHours: Prisma.Decimal,
  ) {
    const start = this.weekStart(workDate);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        engagementId,
        workDate: { gte: start, lt: end },
        status: { in: [TimeEntryStatus.SUBMITTED, TimeEntryStatus.APPROVED, TimeEntryStatus.BILLED] },
      },
      select: { hours: true },
    });
    const total = entries.reduce((acc, e) => acc.add(e.hours), new Prisma.Decimal(0)).add(newHours);
    if (total.toNumber() > weeklyCapHours) {
      throw new BadRequestException(`Weekly cap of ${weeklyCapHours}h would be exceeded`);
    }
  }

  private weekStart(d: Date) {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + diff);
    return date;
  }

  private async getEngagementOrThrow(engagementId: string) {
    const row = await this.prisma.hourlyEngagement.findUnique({
      where: { id: engagementId },
      select: { ...engagementSelect, timeEntries: false },
    });
    if (!row) throw new NotFoundException('Hourly engagement not found');
    return row;
  }

  private async getEntryOrThrow(entryId: string) {
    const row = await this.prisma.timeEntry.findUnique({
      where: { id: entryId },
      select: { ...entrySelect, engagementId: true },
    });
    if (!row) throw new NotFoundException('Time entry not found');
    return row;
  }

  private async assertParticipant(projectId: string, userId: string, role: UserRole) {
    if (role === UserRole.ADMIN) return;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== userId && project.selectedProviderId !== userId) {
      throw new ForbiddenException('Not a project participant');
    }
  }

  private async assertOwner(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== userId) throw new ForbiddenException('Only project owner');
  }

  private async assertSelectedProvider(projectId: string, providerId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { selectedProviderId: true },
    });
    if (!project?.selectedProviderId || project.selectedProviderId !== providerId) {
      throw new ForbiddenException('Not the selected provider on this project');
    }
  }
}
