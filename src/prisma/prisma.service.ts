import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      this.logger.warn(
        'Database unavailable at startup. Start Postgres (e.g. docker compose up -d) before using Prisma.',
      );
      this.logger.debug(err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
