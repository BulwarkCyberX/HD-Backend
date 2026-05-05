import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { userId: string; type: NotificationType; message: string }) {
    return await this.prisma.notification.create({
      data: { userId: input.userId, type: input.type, message: input.message },
    });
  }

  async listForUser(userId: string) {
    return await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(input: { id: string; userId: string }) {
    const existing = await this.prisma.notification.findFirst({
      where: { id: input.id, userId: input.userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Notification not found');
    return await this.prisma.notification.update({
      where: { id: input.id },
      data: { read: true },
    });
  }
}
