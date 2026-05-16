import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
export declare class SessionService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    issueTokenPair(input: {
        userId: string;
        role: UserRole;
        userAgent?: string;
        ipAddress?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshExpiresAt: Date;
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    revokeByRefreshToken(refreshToken: string): Promise<void>;
    listSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userAgent: string | null;
        ipAddress: string | null;
        expiresAt: Date;
        lastUsedAt: Date;
    }[]>;
    revokeSession(userId: string, sessionId: string): Promise<{
        ok: boolean;
    }>;
    revokeOtherSessions(userId: string, currentRefreshToken: string): Promise<{
        ok: boolean;
    }>;
}
