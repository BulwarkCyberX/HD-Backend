import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, WithdrawalRequestStatus, type PaymentCurrency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { KycService } from '../kyc/kyc.service';

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
    private readonly kyc: KycService,
  ) {}

  private readonly select = {
    id: true,
    userId: true,
    amount: true,
    currency: true,
    status: true,
    adminReviewerId: true,
    reviewedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async create(input: { userId: string; role: UserRole; amount: number; currency: PaymentCurrency }) {
    if (input.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admins use separate payout tooling');
    }
    await this.kyc.assertWithdrawalAllowed(input.userId);
    const amt = new Prisma.Decimal(String(input.amount));
    const wallet = await this.wallets.ensureUserWallet(input.userId, input.currency);
    if (wallet.availableBalance.lt(amt)) {
      throw new BadRequestException('Insufficient available balance for withdrawal');
    }
    return this.prisma.withdrawalRequest.create({
      data: {
        userId: input.userId,
        amount: amt,
        currency: input.currency,
        status: WithdrawalRequestStatus.PENDING,
      },
      select: this.select,
    });
  }

  async listMine(userId: string) {
    return this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: this.select,
    });
  }

  async listPendingAdmin(requesterRole: UserRole) {
    if (requesterRole !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    return this.prisma.withdrawalRequest.findMany({
      where: { status: WithdrawalRequestStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: {
        ...this.select,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async approve(input: { adminId: string; role: UserRole; withdrawalId: string }) {
    if (input.role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    const w = await this.prisma.withdrawalRequest.findUnique({
      where: { id: input.withdrawalId },
      select: this.select,
    });
    if (!w) throw new NotFoundException('Withdrawal not found');
    if (w.status !== WithdrawalRequestStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not pending');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.wallets.recordWithdrawalDebitTx(tx, {
        userId: w.userId,
        withdrawalId: w.id,
        amount: new Prisma.Decimal(w.amount.toString()),
        currency: w.currency,
        actorUserId: input.adminId,
      });
      return tx.withdrawalRequest.update({
        where: { id: w.id },
        data: {
          status: WithdrawalRequestStatus.PAID,
          adminReviewerId: input.adminId,
          reviewedAt: new Date(),
        },
        select: this.select,
      });
    });
  }

  async reject(input: { adminId: string; role: UserRole; withdrawalId: string }) {
    if (input.role !== UserRole.ADMIN) throw new ForbiddenException('Admin only');
    const w = await this.prisma.withdrawalRequest.findUnique({
      where: { id: input.withdrawalId },
      select: { id: true, status: true, userId: true, amount: true, currency: true },
    });
    if (!w) throw new NotFoundException('Withdrawal not found');
    if (w.status !== WithdrawalRequestStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not pending');
    }
    return this.prisma.withdrawalRequest.update({
      where: { id: input.withdrawalId },
      data: {
        status: WithdrawalRequestStatus.REJECTED,
        adminReviewerId: input.adminId,
        reviewedAt: new Date(),
      },
      select: this.select,
    });
  }
}
