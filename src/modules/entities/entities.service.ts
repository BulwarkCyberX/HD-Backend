import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntityType, VerificationStatus } from '@prisma/client';

@Injectable()
export class EntitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(input: { userId: string; type: EntityType; name: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new BadRequestException('Invalid user');
    if (user.entityId) throw new BadRequestException('User already linked to an entity');

    const entity = await this.prisma.entity.create({
      data: {
        type: input.type,
        name: input.name,
        verificationStatus: VerificationStatus.PENDING,
      },
      select: { id: true, type: true, name: true, verificationStatus: true, createdAt: true },
    });

    await this.prisma.user.update({
      where: { id: input.userId },
      data: { entityId: entity.id },
    });

    return entity;
  }
}

