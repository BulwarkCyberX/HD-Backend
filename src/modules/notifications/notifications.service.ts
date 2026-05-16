import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationEmailService } from '../email/notification-email.service';
import { DomainEventsService } from '../realtime/domain-events.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEmail: NotificationEmailService,
    private readonly events: DomainEventsService,
  ) {}

  async create(input: { userId: string; type: NotificationType; message: string }) {
    const created = await this.prisma.notification.create({
      data: { userId: input.userId, type: input.type, message: input.message },
    });

    this.events.notificationCreated({ userId: input.userId, notification: created });

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

  /** Weekly email digest for users who opted in (admin/cron trigger). */
  async sendWeeklyDigests() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        userSettings: { select: { emailDigestWeekly: true, lastEmailDigestAt: true } },
      },
    });

    let sent = 0;
    for (const user of users) {
      const enabled = user.userSettings?.emailDigestWeekly ?? true;
      if (!enabled || !user.email) continue;
      if (user.userSettings?.lastEmailDigestAt && user.userSettings.lastEmailDigestAt > since) {
        continue;
      }

      const items = await this.prisma.notification.findMany({
        where: { userId: user.id, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 25,
      });
      if (items.length === 0) continue;

      await this.notificationEmail.sendWeeklyDigestEmail({
        toEmail: user.email,
        firstName: user.firstName ?? 'there',
        items: items.map((n) => ({
          type: n.type,
          message: n.message,
          createdAt: n.createdAt,
        })),
      });

      await this.prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id, lastEmailDigestAt: new Date() },
        update: { lastEmailDigestAt: new Date() },
      });
      sent += 1;
    }

    return { sent, since: since.toISOString() };
  }
}
