import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/auth.types';
import * as sgMail from '@sendgrid/mail';
import type { OAuthProvider } from './oauth.types';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateNumericCode(length = 6) {
  const max = 10 ** length;
  const value = Math.floor(Math.random() * max);
  return String(value).padStart(length, '0');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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
        ...(role === UserRole.PROVIDER
          ? { providerProfile: { create: { skills: [], certifications: [] } } }
          : {}),
        ...(role === UserRole.CLIENT ? { clientProfile: { create: {} } } : {}),
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

    await this.sendLoginCodeEmail(email, code, ttlMinutes);

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
      // Create an account on first successful code verification (email-only onboarding).
      // Password is set to a random value; user can later set/rotate credentials.
      const randomPasswordHash = await bcrypt.hash(`${email}:${Date.now()}:${Math.random()}`, 12);
      user = await this.prisma.user.create({
        data: {
          email,
          password: randomPasswordHash,
          role: UserRole.CLIENT,
          clientProfile: { create: {} },
        },
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
    if (!user) {
      const randomPasswordHash = await bcrypt.hash(`${email}:${Date.now()}:${Math.random()}`, 12);
      user = await this.prisma.user.create({
        data: {
          email,
          password: randomPasswordHash,
          role: UserRole.CLIENT,
          clientProfile: { create: {} },
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

  private async sendLoginCodeEmail(toEmail: string, code: string, ttlMinutes: number) {
    const enabled =
      this.config.get<string>('SENDGRID_ENABLED') === 'true' || !!this.config.get<string>('SENDGRID_API_KEY');
    if (!enabled) return;

    const fromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL');
    if (!fromEmail) return;

    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (apiKey) sgMail.setApiKey(apiKey);

    const fromName = this.config.get<string>('SENDGRID_FROM_NAME') ?? 'HackersDeal';
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
}

