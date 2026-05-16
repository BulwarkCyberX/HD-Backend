import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly reviewSelect = {
    id: true,
    projectId: true,
    clientId: true,
    providerId: true,
    rating: true,
    comment: true,
    createdAt: true,
    provider: {
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
  } as const;

  async create(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    rating: number;
    comment?: string;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can submit reviews');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: {
        id: true,
        clientId: true,
        selectedProviderId: true,
        status: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can submit review');
    }
    if (!project.selectedProviderId) {
      throw new BadRequestException('Project has no selected provider');
    }
    const providerId = project.selectedProviderId;
    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestException('Review can be submitted only after project completion');
    }

    const existing = await this.prisma.review.findUnique({
      where: { projectId: input.projectId },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Review already submitted for this project');
    }

    return await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          projectId: input.projectId,
          clientId: input.requesterId,
          providerId,
          rating: input.rating,
          comment: input.comment,
        },
        select: this.reviewSelect,
      });

      const ratings = await tx.review.findMany({
        where: { providerId },
        select: { rating: true },
      });
      const totalReviews = ratings.length;
      const averageRating =
        totalReviews === 0
          ? 0
          : ratings.reduce((acc, row) => acc + row.rating, 0) / totalReviews;

      const profile = await tx.providerProfile.findUnique({
        where: { userId: providerId },
        select: { validReportCount: true },
      });
      if (!profile) {
        throw new NotFoundException('Provider profile not found');
      }

      const completedProjects = totalReviews;
      const reputationScore = averageRating * 0.5 + profile.validReportCount * 0.3 + completedProjects * 0.2;

      await tx.providerProfile.update({
        where: { userId: providerId },
        data: {
          rating: averageRating,
          totalReviews,
          completedProjects,
          reputationScore,
        },
      });

      return created;
    });
  }

  async createClientReview(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    rating: number;
    comment?: string;
  }) {
    if (input.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can review clients');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: {
        id: true,
        clientId: true,
        selectedProviderId: true,
        status: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.selectedProviderId !== input.requesterId) {
      throw new ForbiddenException('Only the assigned provider can review the client');
    }
    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestException('Review can be submitted only after project completion');
    }

    const existing = await this.prisma.clientReview.findUnique({
      where: { projectId: input.projectId },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('You already reviewed this client for this project');
    }

    return await this.prisma.$transaction(async (tx) => {
      const created = await tx.clientReview.create({
        data: {
          projectId: input.projectId,
          providerId: input.requesterId,
          clientId: project.clientId,
          rating: input.rating,
          comment: input.comment,
        },
        select: {
          id: true,
          projectId: true,
          clientId: true,
          providerId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      });

      const ratings = await tx.clientReview.findMany({
        where: { clientId: project.clientId },
        select: { rating: true },
      });
      const totalReviews = ratings.length;
      const averageRating =
        totalReviews === 0
          ? 0
          : ratings.reduce((acc, row) => acc + row.rating, 0) / totalReviews;

      await tx.clientProfile.upsert({
        where: { userId: project.clientId },
        create: { userId: project.clientId, rating: averageRating, totalReviews },
        update: { rating: averageRating, totalReviews },
      });

      return created;
    });
  }
}
