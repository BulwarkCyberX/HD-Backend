import { BadRequestException, Injectable } from '@nestjs/common';
import {
  LedgerEntryStatus,
  LedgerEntryType,
  PaymentCurrency,
  Prisma,
  type UserWallet,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PlatformFeeService } from './platform-fee.service';

/** Ledger amounts are stored as positive magnitudes; wallet deltas are applied in code by type + target wallet. */
@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly platformFees: PlatformFeeService,
  ) {}

  private platformWalletId(): string {
    return this.config.get<string>('PLATFORM_WALLET_ID') ?? 'platform_wallet_main';
  }

  async ensureUserWallet(userId: string, currency: PaymentCurrency): Promise<UserWallet> {
    const existing = await this.prisma.userWallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.userWallet.create({
      data: { userId, currency },
    });
  }

  async ensurePlatformWallet(): Promise<{ id: string }> {
    const id = this.platformWalletId();
    const row = await this.prisma.platformWallet.findUnique({ where: { id } });
    if (row) return row;
    return this.prisma.platformWallet.create({ data: { id } });
  }

  async getWalletSummary(userId: string) {
    const w = await this.prisma.userWallet.findUnique({
      where: { userId },
      select: {
        availableBalance: true,
        pendingBalance: true,
        escrowBalance: true,
        lifetimeEarnings: true,
        totalSpent: true,
        currency: true,
        updatedAt: true,
      },
    });
    if (!w) {
      return {
        availableBalance: '0',
        pendingBalance: '0',
        escrowBalance: '0',
        lifetimeEarnings: '0',
        totalSpent: '0',
        currency: PaymentCurrency.INR,
        updatedAt: null as Date | null,
      };
    }
    return {
      availableBalance: w.availableBalance.toString(),
      pendingBalance: w.pendingBalance.toString(),
      escrowBalance: w.escrowBalance.toString(),
      lifetimeEarnings: w.lifetimeEarnings.toString(),
      totalSpent: w.totalSpent.toString(),
      currency: w.currency,
      updatedAt: w.updatedAt,
    };
  }

  async recordProjectEscrowDeposit(input: {
    clientUserId: string;
    projectId: string;
    amount: Prisma.Decimal;
    currency: PaymentCurrency;
    actorUserId: string;
  }) {
    return this.prisma.$transaction(async (tx) => this.recordProjectEscrowDepositTx(tx, input));
  }

  async recordProjectEscrowDepositTx(
    tx: Prisma.TransactionClient,
    input: {
      clientUserId: string;
      projectId: string;
      amount: Prisma.Decimal;
      currency: PaymentCurrency;
      actorUserId: string;
    },
  ) {
    const { clientUserId, projectId, amount, currency, actorUserId } = input;
    await this.ensureUserWalletTx(tx, clientUserId, currency);
    const clientWallet = await tx.userWallet.update({
      where: { userId: clientUserId },
      data: {
        escrowBalance: { increment: amount },
        totalSpent: { increment: amount },
      },
    });
    await tx.walletLedgerEntry.create({
      data: {
        type: LedgerEntryType.ESCROW_HOLD,
        amount,
        currency,
        status: LedgerEntryStatus.POSTED,
        referenceId: projectId,
        metadata: { projectId, note: 'ledger_only_direct_escrow' },
        userWalletId: clientWallet.id,
        actorUserId,
      },
    });
    return clientWallet;
  }

  async recordEscrowReleaseAndFees(input: {
    clientUserId: string;
    providerUserId: string;
    projectId: string;
    paymentId: string;
    grossAmount: Prisma.Decimal;
    currency: PaymentCurrency;
    actorUserId: string;
  }) {
    const { clientUserId, providerUserId, projectId, paymentId, grossAmount, currency, actorUserId } = input;
    const { clientFeeBps, providerFeeBps } = await this.platformFees.getActiveFeeBps();
    const clientFee = grossAmount.mul(clientFeeBps).div(10000);
    const providerFee = grossAmount.mul(providerFeeBps).div(10000);
    const platformTotal = clientFee.add(providerFee);
    const netToProvider = grossAmount.sub(clientFee).sub(providerFee);

    return this.prisma.$transaction(async (tx) =>
      this.recordEscrowReleaseAndFeesTx(tx, {
        clientUserId,
        providerUserId,
        projectId,
        paymentId,
        grossAmount,
        currency,
        actorUserId,
        clientFee,
        providerFee,
        platformTotal,
        netToProvider,
        clientFeeBps,
        providerFeeBps,
      }),
    );
  }

  async recordEscrowReleaseAndFeesTx(
    tx: Prisma.TransactionClient,
    input: {
      clientUserId: string;
      providerUserId: string;
      projectId: string;
      paymentId: string;
      grossAmount: Prisma.Decimal;
      currency: PaymentCurrency;
      actorUserId: string;
      clientFee: Prisma.Decimal;
      providerFee: Prisma.Decimal;
      platformTotal: Prisma.Decimal;
      netToProvider: Prisma.Decimal;
      clientFeeBps: number;
      providerFeeBps: number;
    },
  ) {
    const {
      clientUserId,
      providerUserId,
      projectId,
      paymentId,
      grossAmount,
      currency,
      actorUserId,
      clientFee,
      providerFee,
      platformTotal,
      netToProvider,
      clientFeeBps,
      providerFeeBps,
    } = input;
    const platform = await this.ensurePlatformWalletTx(tx);
    await this.ensureUserWalletTx(tx, clientUserId, currency);
    await this.ensureUserWalletTx(tx, providerUserId, currency);

    const clientWallet = await tx.userWallet.findUniqueOrThrow({ where: { userId: clientUserId } });
    const providerWallet = await tx.userWallet.findUniqueOrThrow({ where: { userId: providerUserId } });

    if (clientWallet.escrowBalance.lt(grossAmount)) {
      throw new BadRequestException('Insufficient escrow balance for release');
    }

    await tx.userWallet.update({
      where: { id: clientWallet.id },
      data: { escrowBalance: { decrement: grossAmount } },
    });
    await tx.walletLedgerEntry.create({
      data: {
        type: LedgerEntryType.ESCROW_RELEASE,
        amount: grossAmount,
        currency,
        status: LedgerEntryStatus.POSTED,
        referenceId: paymentId,
        metadata: { projectId, leg: 'client_escrow_release' },
        userWalletId: clientWallet.id,
        actorUserId,
      },
    });

    await tx.userWallet.update({
      where: { id: providerWallet.id },
      data: {
        availableBalance: { increment: netToProvider },
        lifetimeEarnings: { increment: netToProvider },
      },
    });
    await tx.walletLedgerEntry.create({
      data: {
        type: LedgerEntryType.ESCROW_RELEASE,
        amount: netToProvider,
        currency,
        status: LedgerEntryStatus.POSTED,
        referenceId: paymentId,
        metadata: { projectId, leg: 'provider_payout_net' },
        userWalletId: providerWallet.id,
        actorUserId,
      },
    });

    if (platformTotal.gt(0)) {
      await tx.platformWallet.update({
        where: { id: platform.id },
        data: {
          availableBalance: { increment: platformTotal },
          lifetimeEarnings: { increment: platformTotal },
        },
      });
      await tx.walletLedgerEntry.create({
        data: {
          type: LedgerEntryType.PLATFORM_FEE,
          amount: platformTotal,
          currency,
          status: LedgerEntryStatus.POSTED,
          referenceId: paymentId,
          metadata: {
            projectId,
            clientFeeBps,
            providerFeeBps,
            clientFee: clientFee.toString(),
            providerFee: providerFee.toString(),
          },
          platformWalletId: platform.id,
          actorUserId,
        },
      });
    }

    return { netToProvider, platformTotal, clientFee, providerFee };
  }

  /** Milestone fund: immutable ledger line; balances already include project escrow from deposit. */
  async recordMilestoneFundLedgerTx(
    tx: Prisma.TransactionClient,
    input: {
      clientUserId: string;
      projectId: string;
      milestoneId: string;
      amount: Prisma.Decimal;
      currency: PaymentCurrency;
      actorUserId: string;
    },
  ) {
    const { clientUserId, projectId, milestoneId, amount, currency, actorUserId } = input;
    await this.ensureUserWalletTx(tx, clientUserId, currency);
    const clientWallet = await tx.userWallet.findUniqueOrThrow({ where: { userId: clientUserId } });
    await tx.walletLedgerEntry.create({
      data: {
        type: LedgerEntryType.MILESTONE_FUND,
        amount,
        currency,
        status: LedgerEntryStatus.POSTED,
        referenceId: milestoneId,
        metadata: { projectId, milestoneId, informationalAllocationFromProjectEscrow: true },
        userWalletId: clientWallet.id,
        actorUserId,
      },
    });
  }

  async recordMilestoneReleaseTx(
    tx: Prisma.TransactionClient,
    input: {
      clientUserId: string;
      providerUserId: string;
      projectId: string;
      milestoneId: string;
      grossAmount: Prisma.Decimal;
      currency: PaymentCurrency;
      actorUserId: string;
    },
  ) {
    const { clientFeeBps, providerFeeBps } = await this.platformFees.getActiveFeeBps();
    const grossAmount = input.grossAmount;
    const clientFee = grossAmount.mul(clientFeeBps).div(10000);
    const providerFee = grossAmount.mul(providerFeeBps).div(10000);
    const platformTotal = clientFee.add(providerFee);
    const netToProvider = grossAmount.sub(clientFee).sub(providerFee);
    return this.recordEscrowReleaseAndFeesTx(tx, {
      clientUserId: input.clientUserId,
      providerUserId: input.providerUserId,
      projectId: input.projectId,
      paymentId: `milestone:${input.milestoneId}`,
      grossAmount,
      currency: input.currency,
      actorUserId: input.actorUserId,
      clientFee,
      providerFee,
      platformTotal,
      netToProvider,
      clientFeeBps,
      providerFeeBps,
    });
  }

  async recordMilestoneRejectRefundTx(
    tx: Prisma.TransactionClient,
    input: {
      clientUserId: string;
      amount: Prisma.Decimal;
      currency: PaymentCurrency;
      actorUserId: string;
      milestoneId: string;
      projectId: string;
    },
  ) {
    const { clientUserId, amount, currency, actorUserId, milestoneId, projectId } = input;
    await this.ensureUserWalletTx(tx, clientUserId, currency);
    const clientWallet = await tx.userWallet.findUniqueOrThrow({ where: { userId: clientUserId } });
    await tx.userWallet.update({
      where: { id: clientWallet.id },
      data: { escrowBalance: { increment: amount } },
    });
    await tx.walletLedgerEntry.create({
      data: {
        type: LedgerEntryType.MILESTONE_REJECT_REFUND,
        amount,
        currency,
        status: LedgerEntryStatus.POSTED,
        referenceId: milestoneId,
        metadata: { projectId, milestoneId, leg: 'return_allocation_to_escrow' },
        userWalletId: clientWallet.id,
        actorUserId,
      },
    });
  }

  async recordWithdrawalDebit(input: {
    userId: string;
    withdrawalId: string;
    amount: Prisma.Decimal;
    currency: PaymentCurrency;
    actorUserId: string;
  }) {
    return this.prisma.$transaction(async (tx) =>
      this.recordWithdrawalDebitTx(tx, input),
    );
  }

  async recordWithdrawalDebitTx(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      withdrawalId: string;
      amount: Prisma.Decimal;
      currency: PaymentCurrency;
      actorUserId: string;
    },
  ) {
    const { userId, withdrawalId, amount, currency, actorUserId } = input;
    await this.ensureUserWalletTx(tx, userId, currency);
    const uw = await tx.userWallet.findUniqueOrThrow({ where: { userId } });
    if (uw.availableBalance.lt(amount)) {
      throw new BadRequestException('Insufficient available balance');
    }
    await tx.userWallet.update({
      where: { id: uw.id },
      data: { availableBalance: { decrement: amount } },
    });
    await tx.walletLedgerEntry.create({
      data: {
        type: LedgerEntryType.WITHDRAWAL,
        amount,
        currency,
        status: LedgerEntryStatus.POSTED,
        referenceId: withdrawalId,
        userWalletId: uw.id,
        actorUserId,
      },
    });
  }

  async refundWithdrawalHold(input: {
    userId: string;
    withdrawalId: string;
    amount: Prisma.Decimal;
    currency: PaymentCurrency;
    actorUserId: string;
  }) {
    const { userId, withdrawalId, amount, currency, actorUserId } = input;
    return this.prisma.$transaction(async (tx) => {
      const uw = await tx.userWallet.findUnique({ where: { userId } });
      if (!uw) return;
      await tx.userWallet.update({
        where: { id: uw.id },
        data: { availableBalance: { increment: amount } },
      });
      await tx.walletLedgerEntry.create({
        data: {
          type: LedgerEntryType.REFUND,
          amount,
          currency,
          status: LedgerEntryStatus.POSTED,
          referenceId: withdrawalId,
          metadata: { reason: 'withdrawal_rejected' },
          userWalletId: uw.id,
          actorUserId,
        },
      });
    });
  }

  private async ensureUserWalletTx(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: PaymentCurrency,
  ): Promise<UserWallet> {
    const existing = await tx.userWallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return tx.userWallet.create({ data: { userId, currency } });
  }

  private async ensurePlatformWalletTx(tx: Prisma.TransactionClient): Promise<{ id: string }> {
    const id = this.platformWalletId();
    const row = await tx.platformWallet.findUnique({ where: { id } });
    if (row) return row;
    return tx.platformWallet.create({ data: { id } });
  }
}
