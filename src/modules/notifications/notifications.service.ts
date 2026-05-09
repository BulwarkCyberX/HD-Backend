import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationEmailService } from '../email/notification-email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEmail: NotificationEmailService,
  ) {}

  async create(input: { userId: string; type: NotificationType; message: string }) {
    const created = await this.prisma.notification.create({
      data: { userId: input.userId, type: input.type, message: input.message },
    });

    // Fire-and-forget email sending. Never block the main request on email delivery.
    void this.trySendNotificationEmail(input);

    return created;
  }

  private async trySendNotificationEmail(input: {
    userId: string;
    type: NotificationType;
    message: string;
  }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });
      if (!user?.email) return;

      await this.notificationEmail.sendNotificationEmail({
        toEmail: user.email,
        type: input.type,
        message: input.message,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Notification email failed: ${message}`);
    }
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
