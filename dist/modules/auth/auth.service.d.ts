import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import type { OAuthProvider } from './oauth.types';
import { TransactionalEmailService } from '../email/transactional-email.service';
import { SessionService } from './session.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly transactional;
    private readonly sessions;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, transactional: TransactionalEmailService, sessions: SessionService);
    register(input: {
        email: string;
        password: string;
        role?: UserRole;
        firstName: string;
        lastName: string;
        country: string;
        city: string;
        state: string;
        postalCode: string;
    }): Promise<{
        needsEmailVerification: true;
        email: string;
    }>;
    verifyEmail(input: {
        email?: string;
        code?: string;
        token?: string;
    }): Promise<{
        verified: true;
    }>;
    private verifyEmailByToken;
    private verifyEmailByOtp;
    private finishEmailVerification;
    resendVerification(emailInput: string): Promise<{
        ok: true;
    }>;
    forgotPassword(emailInput: string): Promise<{
        ok: true;
    }>;
    resetPassword(input: {
        token: string;
        password: string;
    }): Promise<{
        ok: true;
    }>;
    checkEmailAvailability(emailInput: string): Promise<{
        available: boolean;
    }>;
    login(input: {
        email: string;
        password: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            entityId: string | null;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    requestLoginCode(input: {
        email: string;
    }): Promise<{
        ok: boolean;
    }>;
    verifyLoginCode(input: {
        email: string;
        code: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            entityId: string | null;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    loginWithOAuth(input: {
        provider: OAuthProvider;
        providerId: string;
        email: string;
        displayName?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            entityId: string | null;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshSession(refreshToken: string): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            entityId: string | null;
            createdAt: Date;
        };
        accessToken: string;
    }>;
    logout(refreshToken?: string): Promise<{
        ok: true;
    }>;
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
    revokeOtherSessions(userId: string, refreshToken: string): Promise<{
        ok: boolean;
    }>;
    private issueAuthResponse;
    private signAccessToken;
}
