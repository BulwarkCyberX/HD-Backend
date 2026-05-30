import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../auth/auth.types';
import { SessionPolicy, UserRole } from '@prisma/client';

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

  private async getSessionPolicy() {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
    return {
      policy: settings?.sessionPolicy ?? SessionPolicy.MULTI_DEVICE,
      maxSessions: settings?.maxConcurrentSessions ?? 0,
      refreshDays: settings?.refreshTokenExpiryDays ?? Number(this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS') ?? '7'),
      accessMinutes: settings?.accessTokenExpiryMinutes ?? 15,
    };
  }

  async issueTokenPair(input: {
    userId: string;
    role: UserRole;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const { policy, maxSessions, refreshDays, accessMinutes } = await this.getSessionPolicy();

    // Enforce session policy
    if (policy === SessionPolicy.SINGLE_DEVICE) {
      // Revoke ALL existing sessions for this user
      await this.prisma.userSession.updateMany({
        where: { userId: input.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (maxSessions > 0) {
      // Multi-device with a cap: revoke oldest sessions beyond the limit
      const activeSessions = await this.prisma.userSession.findMany({
        where: { userId: input.userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastUsedAt: 'desc' },
        select: { id: true },
      });
      // We're about to create one more, so if current count >= max, revoke the oldest
      if (activeSessions.length >= maxSessions) {
        const toRevoke = activeSessions.slice(maxSessions - 1).map((s) => s.id);
        if (toRevoke.length > 0) {
          await this.prisma.userSession.updateMany({
            where: { id: { in: toRevoke } },
            data: { revokedAt: new Date() },
          });
        }
      }
    }

    const refreshRaw = randomBytes(48).toString('base64url');
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
      { expiresIn: `${accessMinutes}m` },
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
