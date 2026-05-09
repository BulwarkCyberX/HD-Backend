import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import type { OAuthProvider } from './oauth.types';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
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
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            firstName: string | null;
            lastName: string | null;
            country: string | null;
            city: string | null;
            state: string | null;
            postalCode: string | null;
            entityId: string | null;
            createdAt: Date;
        };
        accessToken: string;
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
    }>;
    private signAccessToken;
    private sendLoginCodeEmail;
}
