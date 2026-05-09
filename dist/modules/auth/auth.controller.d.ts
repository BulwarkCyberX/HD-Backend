import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestLoginCodeDto } from './dto/request-login-code.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
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
    checkEmail(email: string): Promise<{
        available: boolean;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            entityId: string | null;
            createdAt: Date;
        };
        accessToken: string;
    }>;
    requestLoginCode(dto: RequestLoginCodeDto): Promise<{
        ok: boolean;
    }>;
    verifyLoginCode(dto: VerifyLoginCodeDto): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            entityId: string | null;
            createdAt: Date;
        };
        accessToken: string;
    }>;
    oauthGoogle(next: string): {
        next: string;
    };
    oauthGoogleCallback(req: Request, res: Response, next?: string): Promise<void>;
    oauthMicrosoft(next: string): {
        next: string;
    };
    oauthMicrosoftCallback(req: Request, res: Response, next?: string): Promise<void>;
    oauthFacebook(next: string): {
        next: string;
    };
    oauthFacebookCallback(req: Request, res: Response, next?: string): Promise<void>;
    oauthLinkedIn(next: string): {
        next: string;
    };
    oauthLinkedInCallback(req: Request, res: Response, next?: string): Promise<void>;
    private finishOAuth;
}
