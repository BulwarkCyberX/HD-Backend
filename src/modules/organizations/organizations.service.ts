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
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });
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
