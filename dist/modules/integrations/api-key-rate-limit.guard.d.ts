import { CanActivate, ExecutionContext } from '@nestjs/common';
import type Redis from 'ioredis';
export declare class ApiKeyRateLimitGuard implements CanActivate {
    private readonly redis;
    constructor(redis: Redis | undefined);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
