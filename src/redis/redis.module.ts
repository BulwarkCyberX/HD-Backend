import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const REDIS_PLACEHOLDER = 'REDIS_PLACEHOLDER';

/** Placeholder until Redis client (e.g. ioredis) and caching queues are wired. */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_PLACEHOLDER,
      useFactory: (config: ConfigService) => ({
        url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
      }),
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_PLACEHOLDER],
})
export class RedisModule {}
