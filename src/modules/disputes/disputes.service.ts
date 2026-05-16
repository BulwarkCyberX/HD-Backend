import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DisputeStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly select = {
    id: true,
    projectId: true,
    openedById: true,
    category: true,
    status: true,
    title: true,
    description: true,
    resolution: true,
    resolvedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async create(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    category: import('@prisma/client').DisputeCategory;
    title: string;
    description: string;
  }) {
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const ok =
      input.role === UserRole.ADMIN ||
      project.clientId === input.requesterId ||
      project.selectedProviderId === input.requesterId;
    if (!ok) throw new ForbiddenException('Not a project participant');
    return this.prisma.dispute.create({
      data: {
        projectId: input.projectId,
        openedById: input.requesterId,
        category: input.category,
        title: input.title,
        description: input.description,
        status: DisputeStatus.OPEN,
      },
      select: this.select,
    });
  }

  async listForProject(input: { projectId: string; requesterId: string; role: UserRole }) {
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const ok =
      input.role === UserRole.ADMIN ||
      project.clientId === input.requesterId ||
      project.selectedProviderId === input.requesterId;
    if (!ok) throw new ForbiddenException('Not a project participant');
    return this.prisma.dispute.findMany({
      where: { projectId: input.projectId },
      orderBy: { createdAt: 'desc' },
      select: this.select,
    });
  }

  async listAdmin(role: UserRole) {
    if (role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    return this.prisma.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: this.select,
    });
  }

  async addComment(input: {
    disputeId: string;
    requesterId: string;
    role: UserRole;
    body: string;
    internal?: boolean;
  }) {
    const d = await this.prisma.dispute.findUnique({
      where: { id: input.disputeId },
      select: { id: true, projectId: true },
    });
    if (!d) throw new NotFoundException('Dispute not found');
    await this.assertDisputeAccess(d.projectId, input.requesterId, input.role, input.internal);
    if (input.internal && input.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can post internal notes');
    }
    return this.prisma.disputeComment.create({
      data: {
        disputeId: input.disputeId,
        authorId: input.requesterId,
        body: input.body,
        internal: Boolean(input.internal),
      },
      select: {
        id: true,
        body: true,
        internal: true,
        createdAt: true,
        author: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async resolve(input: {
    disputeId: string;
    adminId: string;
    role: UserRole;
    status: DisputeStatus;
    resolution?: string;
  }) {
    if (input.role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    return this.prisma.dispute.update({
      where: { id: input.disputeId },
      data: {
        status: input.status as DisputeStatus,
        resolution: input.resolution ?? null,
        resolvedAt: new Date(),
      },
      select: this.select,
    });
  }

  async markReview(input: { disputeId: string; adminId: string; role: UserRole }) {
    if (input.role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    return this.prisma.dispute.update({
      where: { id: input.disputeId },
      data: { status: DisputeStatus.UNDER_REVIEW },
      select: this.select,
    });
  }

  private async assertDisputeAccess(
    projectId: string,
    userId: string,
    role: UserRole,
    internal?: boolean,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (role === UserRole.ADMIN) return;
    if (project.clientId === userId || project.selectedProviderId === userId) return;
    throw new ForbiddenException('Forbidden');
  }
}
