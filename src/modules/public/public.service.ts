import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectVisibility, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly publicProjectSelect = {
    id: true,
    title: true,
    description: true,
    budgetType: true,
    budgetAmount: true,
    timeline: true,
    visibility: true,
    status: true,
    inScope: true,
    outOfScope: true,
    testingWindow: true,
    createdAt: true,
    projectSkills: {
      select: { skill: { select: { slug: true, label: true } } },
    },
  } as const;

  async listPublicProjects(input?: {
    q?: string;
    minBudget?: number;
    maxBudget?: number;
    budgetType?: string;
    skill?: string;
    sort?: 'newest' | 'budget_asc' | 'budget_desc';
  }) {
    const q = input?.q?.trim();
    const orderBy =
      input?.sort === 'budget_asc'
        ? { budgetAmount: 'asc' as const }
        : input?.sort === 'budget_desc'
          ? { budgetAmount: 'desc' as const }
          : { createdAt: 'desc' as const };

    return this.prisma.project.findMany({
      where: {
        visibility: ProjectVisibility.PUBLIC,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(input?.minBudget != null ? { budgetAmount: { gte: input.minBudget } } : {}),
        ...(input?.maxBudget != null ? { budgetAmount: { lte: input.maxBudget } } : {}),
        ...(input?.budgetType ? { budgetType: input.budgetType as never } : {}),
        ...(input?.skill
          ? {
              projectSkills: {
                some: { skill: { slug: input.skill } },
              },
            }
          : {}),
      },
      orderBy,
      take: 60,
      select: this.publicProjectSelect,
    });
  }

  async getPublicProject(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, visibility: ProjectVisibility.PUBLIC },
      select: this.publicProjectSelect,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async getPublicProvider(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.PROVIDER },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        country: true,
        city: true,
        createdAt: true,
        providerProfile: {
          select: {
            skills: true,
            certifications: true,
            rating: true,
            totalReviews: true,
            completedProjects: true,
            validReportCount: true,
            reputationScore: true,
            bio: true,
            portfolio: true,
            availabilityStatus: true,
            providerSkills: {
              select: { skill: { select: { slug: true, label: true } } },
            },
          },
        },
      },
    });
    if (!user?.providerProfile) throw new NotFoundException('Provider not found');
    return {
      id: user.id,
      displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Security Provider',
      country: user.country,
      city: user.city,
      memberSince: user.createdAt,
      profile: user.providerProfile,
    };
  }

  async listFeaturedProviders() {
    return this.prisma.user.findMany({
      where: { role: UserRole.PROVIDER, providerProfile: { isNot: null } },
      orderBy: { providerProfile: { reputationScore: 'desc' } },
      take: 8,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        providerProfile: {
          select: {
            rating: true,
            reputationScore: true,
            completedProjects: true,
            validReportCount: true,
            bio: true,
            availabilityStatus: true,
            skills: true,
          },
        },
      },
    });
  }
}
