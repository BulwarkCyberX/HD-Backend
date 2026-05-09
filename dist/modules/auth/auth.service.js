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
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const sgMail = require("@sendgrid/mail");
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function generateNumericCode(length = 6) {
    const max = 10 ** length;
    const value = Math.floor(Math.random() * max);
    return String(value).padStart(length, '0');
}
let AuthService = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async register(input) {
        const email = normalizeEmail(input.email);
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing)
            throw new common_1.BadRequestException('Email already registered');
        const passwordHash = await bcrypt.hash(input.password, 12);
        const role = input.role ?? client_1.UserRole.CLIENT;
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
                ...(role === client_1.UserRole.PROVIDER
                    ? { providerProfile: { create: { skills: [], certifications: [] } } }
                    : {}),
                ...(role === client_1.UserRole.CLIENT ? { clientProfile: { create: {} } } : {}),
            },
            select: {
                id: true,
                email: true,
                role: true,
                entityId: true,
                createdAt: true,
                firstName: true,
                lastName: true,
                country: true,
                city: true,
                state: true,
                postalCode: true,
            },
        });
        return {
            user,
            accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
        };
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
        return {
            user: { id: user.id, email: user.email, role: user.role, entityId: user.entityId, createdAt: user.createdAt },
            accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
        };
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
        await this.sendLoginCodeEmail(email, code, ttlMinutes);
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
                },
            });
        }
        return {
            user: { id: user.id, email: user.email, role: user.role, entityId: user.entityId, createdAt: user.createdAt },
            accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
        };
    }
    async loginWithOAuth(input) {
        const email = normalizeEmail(input.email);
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPasswordHash = await bcrypt.hash(`${email}:${Date.now()}:${Math.random()}`, 12);
            user = await this.prisma.user.create({
                data: {
                    email,
                    password: randomPasswordHash,
                    role: client_1.UserRole.CLIENT,
                    clientProfile: { create: {} },
                },
            });
        }
        return {
            user: { id: user.id, email: user.email, role: user.role, entityId: user.entityId, createdAt: user.createdAt },
            accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
        };
    }
    async signAccessToken(payload) {
        return await this.jwt.signAsync(payload);
    }
    async sendLoginCodeEmail(toEmail, code, ttlMinutes) {
        const enabled = this.config.get('SENDGRID_ENABLED') === 'true' || !!this.config.get('SENDGRID_API_KEY');
        if (!enabled)
            return;
        const fromEmail = this.config.get('SENDGRID_FROM_EMAIL');
        if (!fromEmail)
            return;
        const apiKey = this.config.get('SENDGRID_API_KEY');
        if (apiKey)
            sgMail.setApiKey(apiKey);
        const fromName = this.config.get('SENDGRID_FROM_NAME') ?? 'HackersDeal';
        const subject = 'Your HackersDeal login code';
        const text = [
            'Use this one-time code to sign in:',
            '',
            code,
            '',
            `This code expires in ${ttlMinutes} minutes.`,
            '',
            'If you did not request this, you can ignore this email.',
        ].join('\n');
        await sgMail.send({
            to: toEmail,
            from: { email: fromEmail, name: fromName },
            subject,
            text,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map