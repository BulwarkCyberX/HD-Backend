import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        entityId: true,
        createdAt: true,
        entity: { select: { id: true, type: true, name: true, verificationStatus: true, createdAt: true } },
        providerProfile: true,
        clientProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getById(requester: { userId: string; role: UserRole }, id: string) {
    if (requester.role !== UserRole.ADMIN && requester.userId !== id) {
      throw new ForbiddenException('Forbidden');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        entityId: true,
        createdAt: true,
        entity: { select: { id: true, type: true, name: true, verificationStatus: true, createdAt: true } },
        providerProfile: true,
        clientProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getProviderProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        providerProfile: {
          select: {
            bidCredits: true,
            rating: true,
            totalReviews: true,
            completedProjects: true,
            validReportCount: true,
            reputationScore: true,
          },
        },
      },
    });
    if (!user || user.role !== UserRole.PROVIDER || !user.providerProfile) {
      throw new NotFoundException('Provider profile not found');
    }
    return user;
  }
}

