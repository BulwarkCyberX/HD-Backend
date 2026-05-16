import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../auth/auth.types';
import { UserRole } from '@prisma/client';

function hashRefreshToken(raw: string) {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueTokenPair(input: {
    userId: string;
    role: UserRole;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const refreshRaw = randomBytes(48).toString('base64url');
    const refreshDays = Number(this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS') ?? '7');
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

    const accessToken = await this.jwt.signAsync(
      { sub: input.userId, role: input.role } satisfies JwtPayload,
    );

    return { accessToken, refreshToken: refreshRaw, refreshExpiresAt: expiresAt };
  }

  async refreshAccessToken(refreshToken: string) {
    const hash = hashRefreshToken(refreshToken);
    const now = new Date();
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: { select: { id: true, role: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt <= now) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastUsedAt: now },
    });

    const accessToken = await this.jwt.signAsync({
      sub: session.user.id,
      role: session.user.role,
    } satisfies JwtPayload);

    return {
      accessToken,
      user: {
        id: session.user.id,
        role: session.user.role,
      },
    };
  }

  async revokeByRefreshToken(refreshToken: string) {
    const hash = hashRefreshToken(refreshToken);
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listSessions(userId: string) {
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

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async revokeOtherSessions(userId: string, currentRefreshToken: string) {
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
}
