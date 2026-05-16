import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ReportStatus, UserRole, WebhookEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }

  async createApiKey(userId: string, label: string) {
    const raw = `hd_live_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(raw, 'utf8').digest('hex');
    const keyPrefix = raw.slice(0, 16);
    await this.prisma.apiKey.create({
      data: { userId, label, keyPrefix, keyHash, scopes: ['read'] },
    });
    return { apiKey: raw, keyPrefix, label, scopes: ['read'] };
  }

  async revokeApiKey(userId: string, keyId: string) {
    const row = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!row) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id: keyId }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  async validateApiKey(rawKey: string) {
    const keyHash = createHash('sha256').update(rawKey, 'utf8').digest('hex');
    const row = await this.prisma.apiKey.findFirst({
      where: { keyHash, revokedAt: null },
      select: { id: true, userId: true, scopes: true },
    });
    if (!row) return null;
    void this.prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
    return row;
  }

  async listWebhooks(userId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        url: true,
        events: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { deliveries: true } },
      },
    });
  }

  async createWebhook(userId: string, input: { label: string; url: string; events: WebhookEventType[] }) {
    const secret = randomBytes(32).toString('hex');
    const row = await this.prisma.webhookEndpoint.create({
      data: {
        userId,
        label: input.label,
        url: input.url,
        secret,
        events: input.events,
      },
      select: { id: true, label: true, url: true, events: true, enabled: true, createdAt: true },
    });
    return { ...row, signingSecret: secret };
  }

  async deleteWebhook(userId: string, id: string) {
    const row = await this.prisma.webhookEndpoint.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException('Webhook not found');
    await this.prisma.webhookEndpoint.delete({ where: { id } });
    return { ok: true };
  }

  async listDeliveries(userId: string, endpointId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, userId },
      select: { id: true },
    });
    if (!endpoint) throw new ForbiddenException('Webhook not found');
    return this.prisma.webhookDelivery.findMany({
      where: { endpointId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        event: true,
        success: true,
        statusCode: true,
        errorMessage: true,
        createdAt: true,
      },
    });
  }

  async listProjectsForApiUser(userId: string, cursor?: string, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    const rows = await this.prisma.project.findMany({
      where: {
        OR: [{ clientId: userId }, { selectedProviderId: userId }],
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      select: {
        id: true,
        title: true,
        status: true,
        budgetType: true,
        budgetAmount: true,
        visibility: true,
        createdAt: true,
      },
    });
    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt.toISOString() : null,
    };
  }

  private async assertProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== userId && project.selectedProviderId !== userId) {
      throw new ForbiddenException('Not a participant on this project');
    }
    const role =
      project.clientId === userId
        ? UserRole.CLIENT
        : project.selectedProviderId === userId
          ? UserRole.PROVIDER
          : null;
    return { project, role: role! };
  }

  async getProjectForApiUser(userId: string, projectId: string) {
    await this.assertProjectAccess(userId, projectId);
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        budgetType: true,
        budgetAmount: true,
        timeline: true,
        visibility: true,
        clientId: true,
        selectedProviderId: true,
        createdAt: true,
        payment: { select: { status: true, amount: true, currency: true } },
        _count: { select: { reports: true, milestones: true } },
      },
    });
  }

  async listReportsForApiUser(userId: string, projectId: string) {
    const { project, role } = await this.assertProjectAccess(userId, projectId);
    const allowedStatuses: ReportStatus[] | undefined =
      role === UserRole.CLIENT
        ? [ReportStatus.VALID, ReportStatus.NEED_MORE_INFO, ReportStatus.REJECTED]
        : undefined;

    return this.prisma.report.findMany({
      where: {
        projectId,
        ...(role === UserRole.PROVIDER ? { submittedBy: userId } : {}),
        ...(allowedStatuses ? { status: { in: allowedStatuses } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async listMilestonesForApiUser(userId: string, projectId: string) {
    await this.assertProjectAccess(userId, projectId);
    return this.prisma.projectMilestone.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        amount: true,
        currency: true,
        status: true,
        releasedAt: true,
        createdAt: true,
      },
    });
  }

  async setWebhookEnabled(userId: string, id: string, enabled: boolean) {
    const row = await this.prisma.webhookEndpoint.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException('Webhook not found');
    return this.prisma.webhookEndpoint.update({
      where: { id },
      data: { enabled },
      select: { id: true, label: true, enabled: true },
    });
  }
}
