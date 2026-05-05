import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: { email: string; password: string; role?: UserRole }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const role = input.role ?? UserRole.CLIENT;

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: passwordHash,
        role,
        ...(role === UserRole.PROVIDER
          ? { providerProfile: { create: { skills: [], certifications: [] } } }
          : {}),
        ...(role === UserRole.CLIENT ? { clientProfile: { create: {} } } : {}),
      },
      select: { id: true, email: true, role: true, entityId: true, createdAt: true },
    });

    return {
      user,
      accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
    };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return {
      user: { id: user.id, email: user.email, role: user.role, entityId: user.entityId, createdAt: user.createdAt },
      accessToken: await this.signAccessToken({ sub: user.id, role: user.role }),
    };
  }

  private async signAccessToken(payload: JwtPayload) {
    return await this.jwt.signAsync(payload);
  }
}

