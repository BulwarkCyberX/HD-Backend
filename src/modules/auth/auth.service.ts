import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/auth.types';
import type { OAuthProvider } from './oauth.types';
import { TransactionalEmailService } from '../email/transactional-email.service';

const EMAIL_VERIFY_HOURS = 24;
const PASSWORD_RESET_HOURS = 1;
const RESEND_VERIFICATION_COOLDOWN_MS = 60_000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateNumericCode(length = 6) {
  const max = 10 ** length;
  const value = Math.floor(Math.random() * max);
  return String(value).padStart(length, '0');
}

function hashOpaqueToken(raw: string) {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly transactional: TransactionalEmailService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    role?: UserRole;
    firstName: string;
    lastName: string;
    country: string;
    city: string;
    state: string;
    postalCode: string;
  }) {
    const email = normalizeEmail(input.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const role = input.role ?? UserRole.CLIENT;

    const rawToken = randomBytes(32).toString('base64url');
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
        ...(role === UserRole.PROVIDER
          ? { providerProfile: { create: { skills: [], certifications: [] } } }
          : {}),
        ...(role === UserRole.CLIENT ? { clientProfile: { create: {} } } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const webOrigin = (this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${webOrigin}/auth/verify-email/confirm?token=${encodeURIComponent(rawToken)}`;

    await this.transactional.sendSignupVerification({
      to: user.email,
      firstName: user.firstName ?? 'there',
      verifyUrl,
      otp,
      expiresHours: EMAIL_VERIFY_HOURS,
    });

    return {
      needsEmailVerification: true as const,
      email: user.email,
    };
  }

  async verifyEmail(input: { email?: string; code?: string; token?: string }) {
    const token = input.token?.trim();
    if (token) {
      return await this.verifyEmailByToken(token);
    }
    const email = input.email ? normalizeEmail(input.email) : '';
    const code = input.code?.trim() ?? '';
    if (!email || !code) {
      throw new BadRequestException('Provide either a verification link token or your email and 6-digit code');
    }
    return await this.verifyEmailByOtp(email, code);
  }

  private async verifyEmailByToken(rawToken: string) {
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
    if (!user) throw new BadRequestException('Invalid or expired verification link');
    if (user.emailVerifiedAt) {
      return { verified: true as const };
    }
    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= now) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    await this.finishEmailVerification(user.id, user.email, user.firstName ?? 'there');
    return { verified: true as const };
  }

  private async verifyEmailByOtp(email: string, code: string) {
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
    if (!user) throw new BadRequestException('Invalid code');
    if (user.emailVerifiedAt) {
      return { verified: true as const };
    }
    if (!user.emailVerificationOtpHash || !user.emailVerificationExpiresAt) {
      throw new BadRequestException('Invalid code');
    }
    if (user.emailVerificationExpiresAt <= now) {
      throw new BadRequestException('Verification code has expired');
    }
    const ok = await bcrypt.compare(code, user.emailVerificationOtpHash);
    if (!ok) throw new BadRequestException('Invalid code');

    await this.finishEmailVerification(user.id, user.email, user.firstName ?? 'there');
    return { verified: true as const };
  }

  private async finishEmailVerification(userId: string, email: string, firstName: string) {
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

  async resendVerification(emailInput: string) {
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
      return { ok: true as const };
    }
    if (
      user.emailVerificationLastSentAt &&
      now.getTime() - user.emailVerificationLastSentAt.getTime() < RESEND_VERIFICATION_COOLDOWN_MS
    ) {
      return { ok: true as const };
    }

    const rawToken = randomBytes(32).toString('base64url');
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

    const webOrigin = (this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${webOrigin}/auth/verify-email/confirm?token=${encodeURIComponent(rawToken)}`;

    await this.transactional.sendSignupVerification({
      to: user.email,
      firstName: user.firstName ?? 'there',
      verifyUrl,
      otp,
      expiresHours: EMAIL_VERIFY_HOURS,
    });

    return { ok: true as const };
  }

  async forgotPassword(emailInput: string) {
    const email = normalizeEmail(emailInput);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user?.emailVerifiedAt) {
      return { ok: true as const };
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_HOURS * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const webOrigin = (this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${webOrigin}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;

    await this.transactional.sendPasswordReset({
      to: user.email,
      resetUrl,
      expiresHours: PASSWORD_RESET_HOURS,
    });

    return { ok: true as const };
  }

  async resetPassword(input: { token: string; password: string }) {
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
    if (!user) throw new BadRequestException('Invalid or expired reset link');

    const passwordHash = await bcrypt.hash(input.password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return { ok: true as const };
  }

  async checkEmailAvailability(emailInput: string) {
    const email = normalizeEmail(emailInput);
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    return { available: !existing };
  }

  async login(input: { email: string; password: string }) {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({
        message: 'Please verify your email before signing in. Check your inbox for the code.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    return {
      user: { id: user.id, email: user.email, role: user.role, entityId: user.entityId, createdAt: user.createdAt },
      accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
    };
  }

  async requestLoginCode(input: { email: string }) {
    const email = normalizeEmail(input.email);

    const code = generateNumericCode(6);
    const codeHash = await bcrypt.hash(code, 12);

    const ttlMinutes = Number(this.config.get<string>('LOGIN_CODE_TTL_MINUTES') ?? '10');
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

  async verifyLoginCode(input: { email: string; code: string }) {
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

    if (!record) throw new UnauthorizedException('Invalid or expired code');

    const ok = await bcrypt.compare(code, record.codeHash);
    if (!ok) {
      await this.prisma.loginCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid or expired code');
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
          role: UserRole.CLIENT,
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

    return {
      user: { id: user.id, email: user.email, role: user.role, entityId: user.entityId, createdAt: user.createdAt },
      accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
    };
  }

  async loginWithOAuth(input: {
    provider: OAuthProvider;
    providerId: string;
    email: string;
    displayName?: string;
  }) {
    const email = normalizeEmail(input.email);

    let user = await this.prisma.user.findUnique({ where: { email } });
    const now = new Date();
    if (!user) {
      const randomPasswordHash = await bcrypt.hash(`${email}:${Date.now()}:${Math.random()}`, 12);
      user = await this.prisma.user.create({
        data: {
          email,
          password: randomPasswordHash,
          role: UserRole.CLIENT,
          clientProfile: { create: {} },
          emailVerifiedAt: now,
        },
      });
    } else if (!user.emailVerifiedAt) {
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

    return {
      user: { id: user.id, email: user.email, role: user.role, entityId: user.entityId, createdAt: user.createdAt },
      accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
    };
  }

  private async signAccessToken(payload: JwtPayload) {
    return await this.jwt.signAsync(payload);
  }
}
