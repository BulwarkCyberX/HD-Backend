import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationMemberRole, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { ownerId: string; role: UserRole; name: string; slug: string }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create organizations');
    }
    const org = await this.prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        members: {
          create: { userId: input.ownerId, role: OrganizationMemberRole.OWNER },
        },
      },
      select: { id: true, name: true, slug: true, createdAt: true },
    });
    return org;
  }

  async listMine(userId: string) {
    return this.prisma.organization.findMany({
      where: { members: { some: { userId } } },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: { select: { members: true, projects: true } },
      },
    });
  }

  async getById(orgId: string, requesterId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: requesterId },
    });
    if (!member) throw new ForbiddenException('Not a member of this organization');
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        members: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        projects: {
          select: {
            project: {
              select: {
                id: true,
                title: true,
                status: true,
                budgetAmount: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return {
      ...org,
      projects: org.projects.map((p) => p.project),
    };
  }

  async addMember(input: {
    orgId: string;
    requesterId: string;
    email: string;
    role: OrganizationMemberRole;
  }) {
    await this.assertAdminOrOwner(input.orgId, input.requesterId);
    const user = await this.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found for email');
    try {
      return await this.prisma.organizationMember.create({
        data: {
          organizationId: input.orgId,
          userId: user.id,
          role: input.role,
        },
        select: { id: true, role: true, userId: true },
      });
    } catch {
      throw new BadRequestException('Member may already exist');
    }
  }

  async linkProject(input: { orgId: string; projectId: string; requesterId: string }) {
    await this.assertMember(input.orgId, input.requesterId);
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, title: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only the project owner can link it to an organization');
    }
    const existing = await this.prisma.organizationProject.findUnique({
      where: { projectId: input.projectId },
    });
    if (existing && existing.organizationId !== input.orgId) {
      throw new BadRequestException('Project is already linked to another organization');
    }
    if (existing) return { organizationId: input.orgId, projectId: input.projectId };
    return this.prisma.organizationProject.create({
      data: { organizationId: input.orgId, projectId: input.projectId },
      select: { organizationId: true, projectId: true },
    });
  }

  async unlinkProject(input: { orgId: string; projectId: string; requesterId: string }) {
    await this.assertMember(input.orgId, input.requesterId);
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { clientId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only the project owner can unlink it');
    }
    const link = await this.prisma.organizationProject.findFirst({
      where: { organizationId: input.orgId, projectId: input.projectId },
    });
    if (!link) throw new NotFoundException('Project is not linked to this organization');
    await this.prisma.organizationProject.delete({
      where: {
        organizationId_projectId: {
          organizationId: input.orgId,
          projectId: input.projectId,
        },
      },
    });
    return { ok: true as const };
  }

  async listLinkableProjects(orgId: string, requesterId: string) {
    await this.assertMember(orgId, requesterId);
    const linked = await this.prisma.organizationProject.findMany({
      where: { organizationId: orgId },
      select: { projectId: true },
    });
    const linkedIds = linked.map((l) => l.projectId);
    return this.prisma.project.findMany({
      where: {
        clientId: requesterId,
        ...(linkedIds.length > 0 ? { id: { notIn: linkedIds } } : {}),
        organizationLink: null,
      },
      select: { id: true, title: true, status: true, budgetAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async assertMember(orgId: string, userId: string) {
    const m = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId },
    });
    if (!m) throw new ForbiddenException('Not a member of this organization');
  }

  private async assertAdminOrOwner(orgId: string, userId: string) {
    const m = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        userId,
        role: { in: [OrganizationMemberRole.OWNER, OrganizationMemberRole.ADMIN] },
      },
    });
    if (!m) throw new ForbiddenException('Insufficient organization permissions');
  }
}
