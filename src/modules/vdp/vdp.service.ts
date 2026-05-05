import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportSeverity, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VdpService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly publicSelect = {
    id: true,
    title: true,
    scope: true,
    policy: true,
    createdAt: true,
  } as const;

  async create(input: {
    clientId: string;
    role: UserRole;
    title: string;
    scope: unknown;
    policy: string;
  }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create VDP listings');
    }

    return await this.prisma.vdpProgram.create({
      data: {
        clientId: input.clientId,
        title: input.title,
        scope: input.scope as object,
        policy: input.policy,
      },
      select: {
        ...this.publicSelect,
        clientId: true,
      },
    });
  }

  async getPublic(id: string) {
    const row = await this.prisma.vdpProgram.findUnique({
      where: { id },
      select: this.publicSelect,
    });
    if (!row) throw new NotFoundException('VDP not found');
    return row;
  }

  async submitReport(input: {
    vdpId: string;
    title: string;
    description: string;
    contactEmail?: string;
    severity?: ReportSeverity;
  }) {
    const vdp = await this.prisma.vdpProgram.findUnique({
      where: { id: input.vdpId },
      select: { id: true },
    });
    if (!vdp) throw new NotFoundException('VDP not found');

    return await this.prisma.vdpSubmission.create({
      data: {
        vdpId: input.vdpId,
        title: input.title,
        description: input.description,
        contactEmail: input.contactEmail,
        severity: input.severity,
      },
      select: {
        id: true,
        vdpId: true,
        title: true,
        description: true,
        contactEmail: true,
        severity: true,
        createdAt: true,
      },
    });
  }
}
