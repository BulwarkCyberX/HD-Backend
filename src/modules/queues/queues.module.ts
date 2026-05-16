import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
        return {
          connection: new Redis(url, { maxRetriesPerRequest: null }),
        };
      },
    }),
    BullModule.registerQueue({ name: 'notifications' }),
    BullModule.registerQueue({ name: 'emails' }),
    BullModule.registerQueue({ name: 'files' }),
    BullModule.registerQueue({ name: 'ai' }),
    BullModule.registerQueue({ name: 'reports' }),
    BullModule.registerQueue({ name: 'payouts' }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
