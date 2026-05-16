import type { Request, Response } from 'express';
import { type RequestUser } from '../../auth/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestLoginCodeDto } from './dto/request-login-code.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { VerifyEmailTokenDto } from './dto/verify-email-token.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        needsEmailVerification: true;
        email: string;
    }>;
    verifyEmailOtp(dto: VerifyEmailOtpDto): Promise<{
        verified: true;
    }>;
    verifyEmailToken(dto: VerifyEmailTokenDto): Promise<{
        verified: true;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        ok: true;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        ok: true;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        ok: true;
    }>;
    checkEmail(email: string): Promise<{
        available: boolean;
    }>;
    login(dto: LoginDto, req: Request, res: Response): Promise<{
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
    refresh(req: Request, res: Response, body?: {
        refreshToken?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            entityId: string | null;
            createdAt: Date;
        };
        accessToken: string;
    } | {
        message: string;
    }>;
    logout(req: Request, res: Response, body?: {
        refreshToken?: string;
    }): Promise<{
        ok: boolean;
    }>;
    sessions(user: RequestUser): Promise<{
        id: string;
        createdAt: Date;
        userAgent: string | null;
        ipAddress: string | null;
        expiresAt: Date;
        lastUsedAt: Date;
    }[]>;
    revokeSession(user: RequestUser, id: string): Promise<{
        ok: boolean;
    }>;
    revokeOthers(user: RequestUser, req: Request, body?: {
        refreshToken?: string;
    }): Promise<{
        ok: boolean;
    }> | {
        ok: boolean;
    };
    private applyAuthCookies;
    private cookieOpts;
    requestLoginCode(dto: RequestLoginCodeDto): Promise<{
        ok: boolean;
    }>;
    verifyLoginCode(dto: VerifyLoginCodeDto, req: Request, res: Response): Promise<{
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
