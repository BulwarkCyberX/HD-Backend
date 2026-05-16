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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
function hashRefreshToken(raw) {
    return (0, crypto_1.createHash)('sha256').update(raw, 'utf8').digest('hex');
}
let SessionService = class SessionService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async issueTokenPair(input) {
        const refreshRaw = (0, crypto_1.randomBytes)(48).toString('base64url');
        const refreshDays = Number(this.config.get('JWT_REFRESH_EXPIRES_DAYS') ?? '7');
        const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
        await this.prisma.userSession.create({
            data: {
                userId: input.userId,
                refreshTokenHash: hashRefreshToken(refreshRaw),
                userAgent: input.userAgent?.slice(0, 512),
                ipAddress: input.ipAddress?.slice(0, 64),
                expiresAt,
            },
        });
        const accessToken = await this.jwt.signAsync({ sub: input.userId, role: input.role });
        return { accessToken, refreshToken: refreshRaw, refreshExpiresAt: expiresAt };
    }
    async refreshAccessToken(refreshToken) {
        const hash = hashRefreshToken(refreshToken);
        const now = new Date();
        const session = await this.prisma.userSession.findUnique({
            where: { refreshTokenHash: hash },
            include: { user: { select: { id: true, role: true } } },
        });
        if (!session || session.revokedAt || session.expiresAt <= now) {
            throw new common_1.UnauthorizedException('Invalid or expired session');
        }
        await this.prisma.userSession.update({
            where: { id: session.id },
            data: { lastUsedAt: now },
        });
        const accessToken = await this.jwt.signAsync({
            sub: session.user.id,
            role: session.user.role,
        });
        return {
            accessToken,
            user: {
                id: session.user.id,
                role: session.user.role,
            },
        };
    }
    async revokeByRefreshToken(refreshToken) {
        const hash = hashRefreshToken(refreshToken);
        await this.prisma.userSession.updateMany({
            where: { refreshTokenHash: hash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async listSessions(userId) {
        return this.prisma.userSession.findMany({
            where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { lastUsedAt: 'desc' },
            select: {
                id: true,
                userAgent: true,
                ipAddress: true,
                createdAt: true,
                lastUsedAt: true,
                expiresAt: true,
            },
        });
    }
    async revokeSession(userId, sessionId) {
        await this.prisma.userSession.updateMany({
            where: { id: sessionId, userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return { ok: true };
    }
    async revokeOtherSessions(userId, currentRefreshToken) {
        const hash = hashRefreshToken(currentRefreshToken);
        await this.prisma.userSession.updateMany({
            where: {
                userId,
                revokedAt: null,
                NOT: { refreshTokenHash: hash },
            },
            data: { revokedAt: new Date() },
        });
        return { ok: true };
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], SessionService);
//# sourceMappingURL=session.service.js.map