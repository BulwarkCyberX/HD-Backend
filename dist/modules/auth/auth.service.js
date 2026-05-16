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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const transactional_email_service_1 = require("../email/transactional-email.service");
const session_service_1 = require("./session.service");
const EMAIL_VERIFY_HOURS = 24;
const PASSWORD_RESET_HOURS = 1;
const RESEND_VERIFICATION_COOLDOWN_MS = 60_000;
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function generateNumericCode(length = 6) {
    const max = 10 ** length;
    const value = Math.floor(Math.random() * max);
    return String(value).padStart(length, '0');
}
function hashOpaqueToken(raw) {
    return (0, crypto_1.createHash)('sha256').update(raw, 'utf8').digest('hex');
}
let AuthService = class AuthService {
    constructor(prisma, jwt, config, transactional, sessions) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.transactional = transactional;
        this.sessions = sessions;
    }
    async register(input) {
        const email = normalizeEmail(input.email);
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing)
            throw new common_1.BadRequestException('Email already registered');
        const passwordHash = await bcrypt.hash(input.password, 12);
        const role = input.role ?? client_1.UserRole.CLIENT;
        const rawToken = (0, crypto_1.randomBytes)(32).toString('base64url');
        const tokenHash = hashOpaqueToken(rawToken);
        const otp = generateNumericCode(6);
        const otpHash = await bcrypt.hash(otp, 12);
        const expiresAt = new Date(Date.now() + EMAIL_VERIFY_HOURS * 60 * 60 * 1000);
        const sentAt = new Date();
        const user = await this.prisma.user.create({
            data: {
                email,
                password: passwordHash,
                role,
                firstName: input.firstName.trim(),
                lastName: input.lastName.trim(),
                country: input.country.trim().toUpperCase(),
                city: input.city.trim(),
                state: input.state.trim(),
                postalCode: input.postalCode.trim(),
                emailVerifiedAt: null,
                emailVerificationTokenHash: tokenHash,
                emailVerificationExpiresAt: expiresAt,
                emailVerificationOtpHash: otpHash,
                emailVerificationLastSentAt: sentAt,
                ...(role === client_1.UserRole.PROVIDER
                    ? { providerProfile: { create: { skills: [], certifications: [] } } }
                    : {}),
                ...(role === client_1.UserRole.CLIENT ? { clientProfile: { create: {} } } : {}),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            },
        });
        const webOrigin = (this.config.get('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');
        const verifyUrl = `${webOrigin}/auth/verify-email/confirm?token=${encodeURIComponent(rawToken)}`;
        await this.transactional.sendSignupVerification({
            to: user.email,
            firstName: user.firstName ?? 'there',
            verifyUrl,
            otp,
            expiresHours: EMAIL_VERIFY_HOURS,
        });
        return {
            needsEmailVerification: true,
            email: user.email,
        };
    }
    async verifyEmail(input) {
        const token = input.token?.trim();
        if (token) {
            return await this.verifyEmailByToken(token);
        }
        const email = input.email ? normalizeEmail(input.email) : '';
        const code = input.code?.trim() ?? '';
        if (!email || !code) {
            throw new common_1.BadRequestException('Provide either a verification link token or your email and 6-digit code');
        }
        return await this.verifyEmailByOtp(email, code);
    }
    async verifyEmailByToken(rawToken) {
        const tokenHash = hashOpaqueToken(rawToken);
        const now = new Date();
        const user = await this.prisma.user.findFirst({
            where: { emailVerificationTokenHash: tokenHash },
            select: {
                id: true,
                email: true,
                firstName: true,
                emailVerifiedAt: true,
                emailVerificationExpiresAt: true,
            },
        });
        if (!user)
            throw new common_1.BadRequestException('Invalid or expired verification link');
        if (user.emailVerifiedAt) {
            return { verified: true };
        }
        if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= now) {
            throw new common_1.BadRequestException('Invalid or expired verification link');
        }
        await this.finishEmailVerification(user.id, user.email, user.firstName ?? 'there');
        return { verified: true };
    }
    async verifyEmailByOtp(email, code) {
        const now = new Date();
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                firstName: true,
                emailVerifiedAt: true,
                emailVerificationOtpHash: true,
                emailVerificationExpiresAt: true,
            },
        });
        if (!user)
            throw new common_1.BadRequestException('Invalid code');
        if (user.emailVerifiedAt) {
            return { verified: true };
        }
        if (!user.emailVerificationOtpHash || !user.emailVerificationExpiresAt) {
            throw new common_1.BadRequestException('Invalid code');
        }
        if (user.emailVerificationExpiresAt <= now) {
            throw new common_1.BadRequestException('Verification code has expired');
        }
        const ok = await bcrypt.compare(code, user.emailVerificationOtpHash);
        if (!ok)
            throw new common_1.BadRequestException('Invalid code');
        await this.finishEmailVerification(user.id, user.email, user.firstName ?? 'there');
        return { verified: true };
    }
    async finishEmailVerification(userId, email, firstName) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                emailVerifiedAt: new Date(),
                emailVerificationTokenHash: null,
                emailVerificationExpiresAt: null,
                emailVerificationOtpHash: null,
                emailVerificationLastSentAt: null,
            },
        });
        await this.transactional.sendEmailVerifiedWelcome({ to: email, firstName });
    }
    async resendVerification(emailInput) {
        const email = normalizeEmail(emailInput);
        const now = new Date();
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                firstName: true,
                emailVerifiedAt: true,
                emailVerificationLastSentAt: true,
            },
        });
        if (!user || user.emailVerifiedAt) {
            return { ok: true };
        }
        if (user.emailVerificationLastSentAt &&
            now.getTime() - user.emailVerificationLastSentAt.getTime() < RESEND_VERIFICATION_COOLDOWN_MS) {
            return { ok: true };
        }
        const rawToken = (0, crypto_1.randomBytes)(32).toString('base64url');
        const tokenHash = hashOpaqueToken(rawToken);
        const otp = generateNumericCode(6);
        const otpHash = await bcrypt.hash(otp, 12);
        const expiresAt = new Date(Date.now() + EMAIL_VERIFY_HOURS * 60 * 60 * 1000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationTokenHash: tokenHash,
                emailVerificationExpiresAt: expiresAt,
                emailVerificationOtpHash: otpHash,
                emailVerificationLastSentAt: now,
            },
        });
        const webOrigin = (this.config.get('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');
        const verifyUrl = `${webOrigin}/auth/verify-email/confirm?token=${encodeURIComponent(rawToken)}`;
        await this.transactional.sendSignupVerification({
            to: user.email,
            firstName: user.firstName ?? 'there',
            verifyUrl,
            otp,
            expiresHours: EMAIL_VERIFY_HOURS,
        });
        return { ok: true };
    }
    async forgotPassword(emailInput) {
        const email = normalizeEmail(emailInput);
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, emailVerifiedAt: true },
        });
        if (!user?.emailVerifiedAt) {
            return { ok: true };
        }
        const rawToken = (0, crypto_1.randomBytes)(32).toString('base64url');
        const tokenHash = hashOpaqueToken(rawToken);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_HOURS * 60 * 60 * 1000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetTokenHash: tokenHash,
                passwordResetExpiresAt: expiresAt,
            },
        });
        const webOrigin = (this.config.get('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');
        const resetUrl = `${webOrigin}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
        await this.transactional.sendPasswordReset({
            to: user.email,
            resetUrl,
            expiresHours: PASSWORD_RESET_HOURS,
        });
        return { ok: true };
    }
    async resetPassword(input) {
        const rawToken = input.token.trim();
        const tokenHash = hashOpaqueToken(rawToken);
        const now = new Date();
        const user = await this.prisma.user.findFirst({
            where: {
                passwordResetTokenHash: tokenHash,
                passwordResetExpiresAt: { gt: now },
            },
            select: { id: true },
        });
        if (!user)
            throw new common_1.BadRequestException('Invalid or expired reset link');
        const passwordHash = await bcrypt.hash(input.password, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: passwordHash,
                passwordResetTokenHash: null,
                passwordResetExpiresAt: null,
            },
        });
        return { ok: true };
    }
    async checkEmailAvailability(emailInput) {
        const email = normalizeEmail(emailInput);
        const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
        return { available: !existing };
    }
    async login(input) {
        const email = normalizeEmail(input.email);
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(input.password, user.password);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.emailVerifiedAt) {
            throw new common_1.UnauthorizedException({
                message: 'Please verify your email before signing in. Check your inbox for the code.',
                code: 'EMAIL_NOT_VERIFIED',
            });
        }
        return this.issueAuthResponse(user);
    }
    async requestLoginCode(input) {
        const email = normalizeEmail(input.email);
        const code = generateNumericCode(6);
        const codeHash = await bcrypt.hash(code, 12);
        const ttlMinutes = Number(this.config.get('LOGIN_CODE_TTL_MINUTES') ?? '10');
        const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
        await this.prisma.loginCode.create({
            data: {
                email,
                codeHash,
                expiresAt,
            },
        });
        await this.transactional.sendLoginOtp({ to: email, code, ttlMinutes });
        return { ok: true };
    }
    async verifyLoginCode(input) {
        const email = normalizeEmail(input.email);
        const code = input.code.trim();
        const now = new Date();
        const record = await this.prisma.loginCode.findFirst({
            where: {
                email,
                consumedAt: null,
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!record)
            throw new common_1.UnauthorizedException('Invalid or expired code');
        const ok = await bcrypt.compare(code, record.codeHash);
        if (!ok) {
            await this.prisma.loginCode.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            throw new common_1.UnauthorizedException('Invalid or expired code');
        }
        await this.prisma.loginCode.update({
            where: { id: record.id },
            data: { consumedAt: now },
        });
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPasswordHash = await bcrypt.hash(`${email}:${Date.now()}:${Math.random()}`, 12);
            user = await this.prisma.user.create({
                data: {
                    email,
                    password: randomPasswordHash,
                    role: client_1.UserRole.CLIENT,
                    clientProfile: { create: {} },
                    emailVerifiedAt: now,
                },
            });
        }
        if (!user.emailVerifiedAt) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { emailVerifiedAt: now },
            });
        }
        return this.issueAuthResponse(user);
    }
    async loginWithOAuth(input) {
        const email = normalizeEmail(input.email);
        let user = await this.prisma.user.findUnique({ where: { email } });
        const now = new Date();
        if (!user) {
            const randomPasswordHash = await bcrypt.hash(`${email}:${Date.now()}:${Math.random()}`, 12);
            user = await this.prisma.user.create({
                data: {
                    email,
                    password: randomPasswordHash,
                    role: client_1.UserRole.CLIENT,
                    clientProfile: { create: {} },
                    emailVerifiedAt: now,
                },
            });
        }
        else if (!user.emailVerifiedAt) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerifiedAt: now,
                    emailVerificationTokenHash: null,
                    emailVerificationExpiresAt: null,
                    emailVerificationOtpHash: null,
                    emailVerificationLastSentAt: null,
                },
            });
        }
        return this.issueAuthResponse(user);
    }
    async refreshSession(refreshToken) {
        const refreshed = await this.sessions.refreshAccessToken(refreshToken);
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: refreshed.user.id },
            select: { id: true, email: true, role: true, entityId: true, createdAt: true },
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                entityId: user.entityId,
                createdAt: user.createdAt,
            },
            accessToken: refreshed.accessToken,
        };
    }
    async logout(refreshToken) {
        if (refreshToken)
            await this.sessions.revokeByRefreshToken(refreshToken);
        return { ok: true };
    }
    listSessions(userId) {
        return this.sessions.listSessions(userId);
    }
    revokeSession(userId, sessionId) {
        return this.sessions.revokeSession(userId, sessionId);
    }
    revokeOtherSessions(userId, refreshToken) {
        return this.sessions.revokeOtherSessions(userId, refreshToken);
    }
    async issueAuthResponse(user) {
        const tokens = await this.sessions.issueTokenPair({
            userId: user.id,
            role: user.role,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                entityId: user.entityId,
                createdAt: user.createdAt,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    async signAccessToken(payload) {
        return await this.jwt.signAsync(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        transactional_email_service_1.TransactionalEmailService,
        session_service_1.SessionService])
], AuthService);
//# sourceMappingURL=auth.service.js.map