import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus, ReportStatus, UserRole, type BudgetType, type ProjectVisibility } from '@prisma/client';

@Injectable()
export class ProjectsService {
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
    clientId: true,
    selectedProviderId: true,
    selectedProvider: {
      select: {
        id: true,
        email: true,
        providerProfile: {
          select: {
            rating: true,
            totalReviews: true,
            completedProjects: true,
            validReportCount: true,
            reputationScore: true,
          },
        },
      },
    },
    review: {
      select: {
        id: true,
        rating: true,
        comment: true,
        clientId: true,
        providerId: true,
        createdAt: true,
      },
    },
    payment: {
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    },
    status: true,
    createdAt: true,
  } as const;

  async create(input: {
    userId: string;
    role: UserRole;
    title: string;
    description: string;
    assets: Array<{ type: 'DOMAIN' | 'URL' | 'IP'; value: string }>;
    inScope: string[];
    outOfScope: string[];
    testingWindow: string;
    budgetType: BudgetType;
    budgetAmount: number;
    timeline: string;
    visibility: ProjectVisibility;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create projects');
    }

    return await this.prisma.project.create({
      data: {
        title: input.title,
        description: input.description,
        assets: input.assets,
        inScope: input.inScope,
        outOfScope: input.outOfScope,
        testingWindow: input.testingWindow,
        budgetType: input.budgetType,
        budgetAmount: input.budgetAmount,
        timeline: input.timeline,
        visibility: input.visibility,
        clientId: input.userId,
        status: ProjectStatus.DRAFT,
      },
      select: this.projectSelect,
    });
  }

  async listAll() {
    return await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      select: this.projectSelect,
    });
  }

  async getById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: this.projectSelect,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async completeProject(input: {
    projectId: string;
    requesterId: string;
    role: UserRole;
    explicitClientConfirmation: boolean;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can complete projects');
    }
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, status: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can complete project');
    }
    const validReportsCount = await this.prisma.report.count({
      where: { projectId: input.projectId, status: ReportStatus.VALID },
    });
    if (validReportsCount === 0 && !input.explicitClientConfirmation) {
      throw new BadRequestException(
        'No validated report found. Pass explicitClientConfirmation=true to complete project anyway.',
      );
    }

    return await this.prisma.project.update({
      where: { id: input.projectId },
      data: { status: ProjectStatus.COMPLETED },
      select: this.projectSelect,
    });
  }
}

