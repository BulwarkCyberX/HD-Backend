import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function maskPan(pan: string) {
  const p = pan.trim().toUpperCase();
  if (p.length < 4) return '****';
  return `${'*'.repeat(Math.max(0, p.length - 4))}${p.slice(-4)}`;
}

function last4(account: string) {
  const digits = account.replace(/\D/g, '');
  return digits.slice(-4);
}

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    const latest = await this.prisma.kycSubmission.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        panNumberMasked: true,
        panHolderName: true,
        bankAccountLast4: true,
        bankIfsc: true,
        bankAccountHolder: true,
        adminNotes: true,
        reviewedAt: true,
        createdAt: true,
      },
    });
    return {
      status: latest?.status ?? KycStatus.NOT_STARTED,
      submission: latest,
      approved: latest?.status === KycStatus.APPROVED,
    };
  }

  async submit(input: {
    userId: string;
    panNumber: string;
    panHolderName: string;
    bankAccountNumber: string;
    bankIfsc: string;
    bankAccountHolder: string;
  }) {
    const pending = await this.prisma.kycSubmission.findFirst({
      where: { userId, status: KycStatus.PENDING },
    });
    if (pending) {
      throw new BadRequestException('KYC submission already pending review');
    }
    const approved = await this.prisma.kycSubmission.findFirst({
      where: { userId, status: KycStatus.APPROVED },
    });
    if (approved) {
      throw new BadRequestException('KYC already approved');
    }

    return this.prisma.kycSubmission.create({
      data: {
        userId: input.userId,
        status: KycStatus.PENDING,
        panNumberMasked: maskPan(input.panNumber),
        panHolderName: input.panHolderName.trim(),
        bankAccountLast4: last4(input.bankAccountNumber),
        bankIfsc: input.bankIfsc.trim().toUpperCase(),
        bankAccountHolder: input.bankAccountHolder.trim(),
      },
      select: {
        id: true,
        status: true,
        panNumberMasked: true,
        panHolderName: true,
        bankAccountLast4: true,
        bankIfsc: true,
        bankAccountHolder: true,
        createdAt: true,
      },
    });
  }

  async listPendingAdmin(role: UserRole) {
    if (role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    return this.prisma.kycSubmission.findMany({
      where: { status: KycStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        userId: true,
        status: true,
        panNumberMasked: true,
        panHolderName: true,
        bankAccountLast4: true,
        bankIfsc: true,
        bankAccountHolder: true,
        createdAt: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async review(input: {
    adminId: string;
    role: UserRole;
    submissionId: string;
    approve: boolean;
    adminNotes?: string;
  }) {
    if (input.role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    const row = await this.prisma.kycSubmission.findUnique({ where: { id: input.submissionId } });
    if (!row) throw new NotFoundException('KYC submission not found');
    if (row.status !== KycStatus.PENDING) {
      throw new BadRequestException('Submission is not pending');
    }
    return this.prisma.kycSubmission.update({
      where: { id: input.submissionId },
      data: {
        status: input.approve ? KycStatus.APPROVED : KycStatus.REJECTED,
        adminNotes: input.adminNotes?.trim() || null,
        reviewedById: input.adminId,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        status: true,
        adminNotes: true,
        reviewedAt: true,
      },
    });
  }

  async assertWithdrawalAllowed(userId: string) {
    const latest = await this.prisma.kycSubmission.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });
    if (latest?.status !== KycStatus.APPROVED) {
      throw new ForbiddenException('Complete KYC verification before requesting withdrawals');
    }
    const fraud = await this.prisma.fraudFlag.findUnique({ where: { userId } });
    if (fraud && fraud.score >= 80) {
      throw new ForbiddenException('Account restricted. Contact support.');
    }
  }
}
