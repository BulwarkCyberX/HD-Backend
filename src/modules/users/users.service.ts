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
        emailVerifiedAt: true,
        entity: { select: { id: true, type: true, name: true, verificationStatus: true, createdAt: true } },
        providerProfile: true,
        clientProfile: true,
        userSettings: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { emailVerifiedAt, userSettings, ...rest } = user;
    return {
      ...rest,
      emailVerified: !!emailVerifiedAt,
      settings: userSettings ?? { emailDigestWeekly: true, lastEmailDigestAt: null },
    };
  }

  async updateSettings(userId: string, input: { emailDigestWeekly?: boolean }) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        emailDigestWeekly: input.emailDigestWeekly ?? true,
      },
      update: {
        ...(input.emailDigestWeekly !== undefined
          ? { emailDigestWeekly: input.emailDigestWeekly }
          : {}),
      },
    });
    return settings;
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

  async updateProviderProfile(
    userId: string,
    role: UserRole,
    input: {
      bio?: string;
      portfolio?: unknown;
      availabilityStatus?: string;
      skills?: string[];
      certifications?: string[];
    },
  ) {
    if (role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can update provider profile');
    }
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');
    await this.prisma.providerProfile.update({
      where: { userId },
      data: {
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.portfolio !== undefined ? { portfolio: input.portfolio as object } : {}),
        ...(input.availabilityStatus !== undefined
          ? { availabilityStatus: input.availabilityStatus }
          : {}),
        ...(input.skills !== undefined ? { skills: input.skills } : {}),
        ...(input.certifications !== undefined ? { certifications: input.certifications } : {}),
      },
    });
    return this.getMe(userId);
  }
}

