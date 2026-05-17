"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const redis_module_1 = require("../../redis/redis.module");
const LIMIT_PER_MINUTE = 120;
let ApiKeyRateLimitGuard = class ApiKeyRateLimitGuard {
    constructor(redis) {
        this.redis = redis;
    }
    async canActivate(context) {
        if (!this.redis)
            return true;
        const req = context.switchToHttp().getRequest();
        const apiKeyHeader = req.headers['x-api-key'];
        const keyId = typeof apiKeyHeader === 'string'
            ? apiKeyHeader.slice(0, 16)
            : req.apiUser?.userId ?? 'anon';
        const bucket = Math.floor(Date.now() / 60_000);
        const redisKey = `api:rl:${keyId}:${bucket}`;
        const count = await this.redis.incr(redisKey);
        if (count === 1)
            await this.redis.expire(redisKey, 90);
        if (count > LIMIT_PER_MINUTE) {
            throw new common_1.HttpException(`API rate limit exceeded (${LIMIT_PER_MINUTE}/min). Retry later.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.ApiKeyRateLimitGuard = ApiKeyRateLimitGuard;
exports.ApiKeyRateLimitGuard = ApiKeyRateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [Object])
], ApiKeyRateLimitGuard);
//# sourceMappingURL=api-key-rate-limit.guard.js.map