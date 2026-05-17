import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
  Optional,
} from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';

const LIMIT_PER_MINUTE = 120;

@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
  constructor(@Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | undefined) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.redis) return true;

    const req = context.switchToHttp().getRequest() as {
      apiUser?: { userId: string };
      headers: Record<string, string | string[] | undefined>;
    };
    const apiKeyHeader = req.headers['x-api-key'];
    const keyId =
      typeof apiKeyHeader === 'string'
        ? apiKeyHeader.slice(0, 16)
        : req.apiUser?.userId ?? 'anon';
    const bucket = Math.floor(Date.now() / 60_000);
    const redisKey = `api:rl:${keyId}:${bucket}`;

    const count = await this.redis.incr(redisKey);
    if (count === 1) await this.redis.expire(redisKey, 90);

    if (count > LIMIT_PER_MINUTE) {
      throw new HttpException(
        `API rate limit exceeded (${LIMIT_PER_MINUTE}/min). Retry later.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
