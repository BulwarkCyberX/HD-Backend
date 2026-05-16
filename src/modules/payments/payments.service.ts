import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationType,
  PaymentStatus,
  Prisma,
  ProjectStatus,
  UserRole,
  type PaymentCurrency,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallets/wallet.service';
import { PlatformFeeService } from '../wallets/platform-fee.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly wallets: WalletService,
    private readonly platformFees: PlatformFeeService,
  ) {}

  private readonly paymentSelect = {
    id: true,
    projectId: true,
    payerId: true,
    payeeId: true,
    amount: true,
    currency: true,
    status: true,
    createdAt: true,
  } as const;

  /** Ledger-only deposit — gated in production; use PSP checkout for real funds. */
  async deposit(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    amount: number;
    currency: PaymentCurrency;
    allowLedgerOnly?: boolean;
  }) {
    const allowLedgerOnly =
      input.allowLedgerOnly ??
      (process.env.ALLOW_LEDGER_ONLY_DEPOSIT === 'true' || process.env.NODE_ENV !== 'production');
    if (!allowLedgerOnly) {
      throw new BadRequestException(
        'Direct ledger deposit is disabled. Use POST /payments/checkout/create with a payment provider.',
      );
    }
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can deposit payment');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can deposit payment');
    }
    if (!project.selectedProviderId) {
      throw new BadRequestException('Project must have selected provider before deposit');
    }

    const existing = await this.prisma.payment.findUnique({
      where: { projectId: input.projectId },
      select: { id: true, status: true },
    });
    if (existing) {
      throw new BadRequestException('Payment already exists for this project');
    }

    const amountDec = new Prisma.Decimal(String(input.amount));

    return await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          projectId: input.projectId,
          payerId: input.requesterId,
          payeeId: project.selectedProviderId!,
          amount: input.amount,
          currency: input.currency,
          status: PaymentStatus.IN_ESCROW,
        },
        select: { id: true },
      });
      await this.wallets.recordProjectEscrowDepositTx(tx, {
        clientUserId: input.requesterId,
        projectId: input.projectId,
        amount: amountDec,
        currency: input.currency,
        actorUserId: input.requesterId,
      });
      return tx.payment.findUniqueOrThrow({
        where: { id: created.id },
        select: this.paymentSelect,
      });
    });
  }

  /** Called after PSP confirms payment — skips ledger-only gate. */
  async depositFromPsp(input: {
    requesterId: string;
    projectId: string;
    amount: number;
    currency: PaymentCurrency;
  }) {
    return this.deposit({
      requesterId: input.requesterId,
      role: UserRole.CLIENT,
      projectId: input.projectId,
      amount: input.amount,
      currency: input.currency,
      allowLedgerOnly: true,
    });
  }

  async release(input: { requesterId: string; role: UserRole; projectId: string }) {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can release payment');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, status: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can release payment');
    }
    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestException('Project must be completed before release');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { projectId: input.projectId },
      select: { id: true, status: true, amount: true, currency: true, payeeId: true, projectId: true },
    });
    if (!payment) throw new NotFoundException('Payment not found for project');
    if (payment.status !== PaymentStatus.IN_ESCROW) {
      throw new BadRequestException('Only escrowed payments can be released');
    }

    const { clientFeeBps, providerFeeBps } = await this.platformFees.getActiveFeeBps();
    const payAmt = new Prisma.Decimal(String(payment.amount));
    const clientWallet = await this.prisma.userWallet.findUnique({
      where: { userId: project.clientId },
      select: { escrowBalance: true },
    });
    const escrowBal = clientWallet?.escrowBalance ?? new Prisma.Decimal(0);
    const gross = payAmt.lt(escrowBal) ? payAmt : escrowBal;

    return await this.prisma.$transaction(async (tx) => {
      const released = await tx.payment.update({
        where: { projectId: input.projectId },
        data: { status: PaymentStatus.RELEASED },
        select: this.paymentSelect,
      });

      if (gross.gt(0)) {
        const clientFee = gross.mul(clientFeeBps).div(10000);
        const providerFee = gross.mul(providerFeeBps).div(10000);
        const platformTotal = clientFee.add(providerFee);
        const netToProvider = gross.sub(clientFee).sub(providerFee);
        await this.wallets.recordEscrowReleaseAndFeesTx(tx, {
          clientUserId: project.clientId,
          providerUserId: payment.payeeId,
          projectId: payment.projectId,
          paymentId: payment.id,
          grossAmount: gross,
          currency: payment.currency,
          actorUserId: input.requesterId,
          clientFee,
          providerFee,
          platformTotal,
          netToProvider,
          clientFeeBps,
          providerFeeBps,
        });
      }

      await this.notifications.create({
        userId: released.payeeId,
        type: NotificationType.PAYMENT_RELEASED,
        message: `Escrow payment released for project ${released.projectId}`,
      });

      return released;
    });
  }
}
