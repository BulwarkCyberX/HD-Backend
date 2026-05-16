import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

/** Optional cron: set ENABLE_WEEKLY_DIGEST_CRON=true. Runs Mondays at DIGEST_CRON_HOUR_UTC (default 9). */
@Injectable()
export class DigestSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DigestSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastRunWeekKey: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    if (this.config.get<string>('ENABLE_WEEKLY_DIGEST_CRON') !== 'true') {
      return;
    }
    const hourUtc = Number(this.config.get<string>('DIGEST_CRON_HOUR_UTC') ?? '9');
    this.logger.log(`Weekly digest cron enabled (Mondays ~${hourUtc}:00 UTC)`);
    this.timer = setInterval(() => void this.tick(hourUtc), 5 * 60 * 1000);
    setTimeout(() => void this.tick(hourUtc), 15_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private weekKey(d = new Date()) {
    const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
    const week = Math.ceil((days + jan1.getUTCDay() + 1) / 7);
    return `${d.getUTCFullYear()}-W${week}`;
  }

  private async tick(hourUtc: number) {
    const now = new Date();
    if (now.getUTCDay() !== 1) return;
    if (now.getUTCHours() !== hourUtc) return;

    const key = this.weekKey(now);
    if (this.lastRunWeekKey === key) return;
    this.lastRunWeekKey = key;

    try {
      const result = await this.notifications.sendWeeklyDigests();
      this.logger.log(`Weekly digest sent to ${result.sent} users`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Weekly digest cron failed: ${message}`);
    }
  }
}
