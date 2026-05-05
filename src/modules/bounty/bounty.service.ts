import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BugBountyProgramStatus,
  BugReportStatus,
  NotificationType,
  ReportSeverity,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BountyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private readonly programSelect = {
    id: true,
    clientId: true,
    title: true,
    description: true,
    scope: true,
    rewardTable: true,
    status: true,
    allowedResearcherIds: true,
    createdAt: true,
  } as const;

  private readonly bugReportSelect = {
    id: true,
    programId: true,
    researcherId: true,
    title: true,
    description: true,
    severity: true,
    status: true,
    createdAt: true,
    researcher: { select: { id: true, email: true } },
    files: {
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    },
  } as const;

  async createProgram(input: {
    clientId: string;
    role: UserRole;
    title: string;
    description: string;
    scope: unknown;
    rewardTable: unknown;
    status?: BugBountyProgramStatus;
    allowedResearcherIds?: string[];
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create bug bounty programs');
    }

    return await this.prisma.bugBountyProgram.create({
      data: {
        clientId: input.clientId,
        title: input.title,
        description: input.description ?? '',
        scope: input.scope as object,
        rewardTable: input.rewardTable as object,
        status: input.status ?? BugBountyProgramStatus.DRAFT,
        allowedResearcherIds: input.allowedResearcherIds ?? [],
      },
      select: this.programSelect,
    });
  }

  async listPrograms(input: { requesterId: string; role: UserRole }) {
    if (input.role === UserRole.ADMIN) {
      return await this.prisma.bugBountyProgram.findMany({
        orderBy: { createdAt: 'desc' },
        select: this.programSelect,
      });
    }
    if (input.role === UserRole.CLIENT) {
      return await this.prisma.bugBountyProgram.findMany({
        where: { clientId: input.requesterId },
        orderBy: { createdAt: 'desc' },
        select: this.programSelect,
      });
    }
    if (input.role === UserRole.PROVIDER) {
      return await this.prisma.bugBountyProgram.findMany({
        where: {
          status: BugBountyProgramStatus.ACTIVE,
          allowedResearcherIds: { has: input.requesterId },
        },
        orderBy: { createdAt: 'desc' },
        select: this.programSelect,
      });
    }
    return [];
  }

  async getProgram(input: { id: string; requesterId: string; role: UserRole }) {
    const program = await this.prisma.bugBountyProgram.findUnique({
      where: { id: input.id },
      select: this.programSelect,
    });
    if (!program) throw new NotFoundException('Program not found');

    if (input.role === UserRole.ADMIN) return program;
    if (program.clientId === input.requesterId) return program;
    if (
      input.role === UserRole.PROVIDER &&
      program.status === BugBountyProgramStatus.ACTIVE &&
      program.allowedResearcherIds.includes(input.requesterId)
    ) {
      return program;
    }

    throw new ForbiddenException('You do not have access to this program');
  }

  async createBugReport(input: {
    researcherId: string;
    role: UserRole;
    programId: string;
    title: string;
    description: string;
    severity: ReportSeverity;
  }) {
    if (input.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only researchers (providers) can submit bounty reports');
    }

    const program = await this.prisma.bugBountyProgram.findUnique({
      where: { id: input.programId },
      select: {
        id: true,
        clientId: true,
        status: true,
        allowedResearcherIds: true,
      },
    });
    if (!program) throw new NotFoundException('Program not found');
    if (program.status !== BugBountyProgramStatus.ACTIVE) {
      throw new BadRequestException('Program is not accepting submissions');
    }
    if (!program.allowedResearcherIds.includes(input.researcherId)) {
      throw new ForbiddenException('You are not invited to this private program');
    }

    const created = await this.prisma.bugReport.create({
      data: {
        programId: input.programId,
        researcherId: input.researcherId,
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: BugReportStatus.SUBMITTED,
      },
      select: this.bugReportSelect,
    });

    await this.notifications.create({
      userId: program.clientId,
      type: NotificationType.BUG_BOUNTY_REPORT_SUBMITTED,
      message: `New vulnerability submission on bounty program (${created.title})`,
    });

    return created;
  }

  async listReportsForProgram(input: {
    programId: string;
    requesterId: string;
    role: UserRole;
  }) {
    const program = await this.prisma.bugBountyProgram.findUnique({
      where: { id: input.programId },
      select: {
        id: true,
        clientId: true,
        status: true,
        allowedResearcherIds: true,
      },
    });
    if (!program) throw new NotFoundException('Program not found');

    if (input.role === UserRole.ADMIN) {
      return await this.prisma.bugReport.findMany({
        where: { programId: input.programId },
        orderBy: { createdAt: 'desc' },
        select: this.bugReportSelect,
      });
    }

    if (program.clientId === input.requesterId) {
      return await this.prisma.bugReport.findMany({
        where: { programId: input.programId },
        orderBy: { createdAt: 'desc' },
        select: this.bugReportSelect,
      });
    }

    if (
      input.role === UserRole.PROVIDER &&
      program.allowedResearcherIds.includes(input.requesterId)
    ) {
      return await this.prisma.bugReport.findMany({
        where: { programId: input.programId, researcherId: input.requesterId },
        orderBy: { createdAt: 'desc' },
        select: this.bugReportSelect,
      });
    }

    throw new ForbiddenException('You cannot view reports for this program');
  }

  async updateBugReportStatus(input: {
    reportId: string;
    requesterId: string;
    role: UserRole;
    status: BugReportStatus;
  }) {
    if (input.role === UserRole.ADMIN) {
      return await this.patchReportStatus(input.reportId, input.status);
    }
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only program owners can update bounty report status');
    }

    const report = await this.prisma.bugReport.findUnique({
      where: { id: input.reportId },
      select: {
        id: true,
        program: { select: { clientId: true } },
      },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.program.clientId !== input.requesterId) {
      throw new ForbiddenException('Only the program owner can triage bounty submissions');
    }

    return await this.patchReportStatus(input.reportId, input.status);
  }

  private async patchReportStatus(reportId: string, status: BugReportStatus) {
    const allowed: BugReportStatus[] = [
      BugReportStatus.VALID,
      BugReportStatus.REJECTED,
      BugReportStatus.DUPLICATE,
    ];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Invalid status transition for bounty triage');
    }

    return await this.prisma.bugReport.update({
      where: { id: reportId },
      data: { status },
      select: this.bugReportSelect,
    });
  }
}
