import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, ReportStatus, UserRole, type ReportSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DomainEventsService } from '../realtime/domain-events.service';
import { AiTriageService } from '../ai/ai-triage.service';
import { WebhookDispatcherService } from '../integrations/webhook-dispatcher.service';
import { WebhookEventType } from '@prisma/client';
import { FraudService } from '../trust/fraud.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly events: DomainEventsService,
    private readonly aiTriage: AiTriageService,
    private readonly webhooks: WebhookDispatcherService,
    private readonly fraud: FraudService,
  ) {}

  private readonly reportSelect = {
    id: true,
    projectId: true,
    submittedBy: true,
    title: true,
    description: true,
    severity: true,
    status: true,
    triageNotes: true,
    aiTriageHints: true,
    validatedBy: true,
    createdAt: true,
    submitter: { select: { id: true, email: true, role: true } },
    validator: { select: { id: true, email: true, role: true } },
    files: {
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    },
    project: {
      select: {
        id: true,
        title: true,
        clientId: true,
        selectedProviderId: true,
      },
    },
  } as const;

  private async assertProjectParticipant(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const isParticipant = project.clientId === userId || project.selectedProviderId === userId;
    if (!isParticipant) throw new ForbiddenException('Only workspace participants can access reports');
    return project;
  }

  async create(input: {
    projectId: string;
    submittedBy: string;
    title: string;
    description: string;
    severity: ReportSeverity;
  }) {
    const project = await this.assertProjectParticipant(input.projectId, input.submittedBy);
    if (project.selectedProviderId !== input.submittedBy) {
      throw new ForbiddenException('Only selected provider can submit reports');
    }

    const created = await this.prisma.report.create({
      data: {
        projectId: input.projectId,
        submittedBy: input.submittedBy,
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: ReportStatus.SUBMITTED,
      },
      select: this.reportSelect,
    });

    await this.notifications.create({
      userId: project.clientId,
      type: NotificationType.REPORT_SUBMITTED,
      message: `New security report submitted on "${created.project.title}"`,
    });

    this.events.reportUpdated({ projectId: input.projectId, report: created });

    void this.aiTriage.runForReport(created.id, input.submittedBy).catch(() => undefined);
    void this.fraud.checkReportVelocity(input.submittedBy).catch(() => undefined);

    return created;
  }

  async runAiTriage(input: { reportId: string; requesterRole: UserRole; requesterId: string }) {
    if (input.requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can run AI triage');
    }
    const hints = await this.aiTriage.runForReport(input.reportId, input.requesterId);
    if (!hints) throw new NotFoundException('Report not found');
    return this.prisma.report.findUnique({
      where: { id: input.reportId },
      select: this.reportSelect,
    });
  }

  async listByProject(input: { projectId: string; requesterId: string; requesterRole: UserRole }) {
    const project =
      input.requesterRole === UserRole.ADMIN
        ? await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, selectedProviderId: true },
          })
        : await this.assertProjectParticipant(input.projectId, input.requesterId);
    if (!project) throw new NotFoundException('Project not found');

    let allowedStatuses: ReportStatus[] | undefined;
    if (input.requesterRole === UserRole.CLIENT) {
      allowedStatuses = [ReportStatus.VALID, ReportStatus.NEED_MORE_INFO, ReportStatus.REJECTED];
    }

    return await this.prisma.report.findMany({
      where: {
        projectId: input.projectId,
        ...(input.requesterRole === UserRole.PROVIDER ? { submittedBy: input.requesterId } : {}),
        ...(allowedStatuses ? { status: { in: allowedStatuses } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: this.reportSelect,
    });
  }

  async listAllForAdmin(input: { requesterRole: UserRole }) {
    if (input.requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can access triage report list');
    }
    return await this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      select: this.reportSelect,
    });
  }

  async triage(input: {
    reportId: string;
    requesterId: string;
    requesterRole: UserRole;
    status: 'VALID' | 'REJECTED' | 'NEED_MORE_INFO';
    triageNotes: string;
  }) {
    if (input.requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can triage reports');
    }

    const existing = await this.prisma.report.findUnique({
      where: { id: input.reportId },
      select: { id: true, status: true, submittedBy: true },
    });
    if (!existing) throw new NotFoundException('Report not found');

    const wasAlreadyValid = existing.status === ReportStatus.VALID;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.report.update({
        where: { id: input.reportId },
        data: {
          status: input.status,
          triageNotes: input.triageNotes,
          validatedBy: input.requesterId,
        },
        select: this.reportSelect,
      });

      if (!wasAlreadyValid && input.status === 'VALID') {
        await tx.providerProfile.update({
          where: { userId: existing.submittedBy },
          data: {
            validReportCount: { increment: 1 },
          },
        });

        const profile = await tx.providerProfile.findUnique({
          where: { userId: existing.submittedBy },
          select: {
            rating: true,
            validReportCount: true,
            completedProjects: true,
          },
        });
        if (profile) {
          const reputationScore =
            profile.rating * 0.5 + profile.validReportCount * 0.3 + profile.completedProjects * 0.2;
          await tx.providerProfile.update({
            where: { userId: existing.submittedBy },
            data: { reputationScore },
          });
        }
      }

      return row;
    });

    if (!wasAlreadyValid && input.status === 'VALID') {
      await this.notifications.create({
        userId: existing.submittedBy,
        type: NotificationType.REPORT_VALIDATED,
        message: `Your workspace security report was marked VALID`,
      });
      void this.webhooks.dispatch(updated.project.clientId, WebhookEventType.REPORT_VALIDATED, {
        reportId: updated.id,
        projectId: updated.projectId,
        title: updated.title,
        severity: updated.severity,
      });
    }

    this.events.reportUpdated({ projectId: updated.projectId, report: updated });

    return updated;
  }
}
