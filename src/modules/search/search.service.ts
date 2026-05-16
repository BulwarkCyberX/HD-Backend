import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchProjects(input: { q: string; requesterId: string; role: UserRole }) {
    const q = input.q.trim();
    if (q.length < 2) return [];
    const visibilityFilter =
      input.role === UserRole.ADMIN
        ? {}
        : {
            OR: [{ visibility: 'PUBLIC' as const }, { clientId: input.requesterId }],
          };
    return this.prisma.project.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          visibilityFilter,
        ],
      },
      take: 40,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        budgetAmount: true,
        budgetType: true,
        status: true,
        visibility: true,
        createdAt: true,
        clientId: true,
      },
    });
  }

  async searchProviders(input: { q: string }) {
    const q = input.q.trim();
    if (q.length < 2) return [];
    return this.prisma.user.findMany({
      where: {
        role: UserRole.PROVIDER,
        email: { contains: q, mode: 'insensitive' },
      },
      take: 30,
      select: {
        id: true,
        email: true,
        providerProfile: {
          select: {
            skills: true,
            rating: true,
            reputationScore: true,
            completedProjects: true,
          },
        },
      },
    });
  }

  async listSavedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, queryJson: true, createdAt: true, updatedAt: true },
    });
  }

  async createSavedSearch(userId: string, name: string, queryJson: object) {
    return this.prisma.savedSearch.create({
      data: { userId, name, queryJson },
      select: { id: true, name: true, queryJson: true, createdAt: true },
    });
  }

  async trendingProjects() {
    return this.prisma.project.findMany({
      where: { visibility: 'PUBLIC', status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
      take: 12,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        budgetAmount: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
