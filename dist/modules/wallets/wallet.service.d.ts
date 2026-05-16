import { PaymentCurrency, Prisma, type UserWallet } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PlatformFeeService } from './platform-fee.service';
export declare class WalletService {
    private readonly prisma;
    private readonly config;
    private readonly platformFees;
    constructor(prisma: PrismaService, config: ConfigService, platformFees: PlatformFeeService);
    private platformWalletId;
    ensureUserWallet(userId: string, currency: PaymentCurrency): Promise<UserWallet>;
    ensurePlatformWallet(): Promise<{
        id: string;
    }>;
    getWalletSummary(userId: string): Promise<{
        availableBalance: string;
        pendingBalance: string;
        escrowBalance: string;
        lifetimeEarnings: string;
        totalSpent: string;
        currency: "INR";
        updatedAt: Date | null;
    } | {
        availableBalance: string;
        pendingBalance: string;
        escrowBalance: string;
        lifetimeEarnings: string;
        totalSpent: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
    }>;
    recordProjectEscrowDeposit(input: {
        clientUserId: string;
        projectId: string;
        amount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        availableBalance: Prisma.Decimal;
        pendingBalance: Prisma.Decimal;
        escrowBalance: Prisma.Decimal;
        lifetimeEarnings: Prisma.Decimal;
        totalSpent: Prisma.Decimal;
    }>;
    recordProjectEscrowDepositTx(tx: Prisma.TransactionClient, input: {
        clientUserId: string;
        projectId: string;
        amount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        availableBalance: Prisma.Decimal;
        pendingBalance: Prisma.Decimal;
        escrowBalance: Prisma.Decimal;
        lifetimeEarnings: Prisma.Decimal;
        totalSpent: Prisma.Decimal;
    }>;
    recordEscrowReleaseAndFees(input: {
        clientUserId: string;
        providerUserId: string;
        projectId: string;
        paymentId: string;
        grossAmount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
    }): Promise<{
        netToProvider: Prisma.Decimal;
        platformTotal: Prisma.Decimal;
        clientFee: Prisma.Decimal;
        providerFee: Prisma.Decimal;
    }>;
    recordEscrowReleaseAndFeesTx(tx: Prisma.TransactionClient, input: {
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
    }): Promise<{
        netToProvider: Prisma.Decimal;
        platformTotal: Prisma.Decimal;
        clientFee: Prisma.Decimal;
        providerFee: Prisma.Decimal;
    }>;
    recordMilestoneFundLedgerTx(tx: Prisma.TransactionClient, input: {
        clientUserId: string;
        projectId: string;
        milestoneId: string;
        amount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
    }): Promise<void>;
    recordMilestoneReleaseTx(tx: Prisma.TransactionClient, input: {
        clientUserId: string;
        providerUserId: string;
        projectId: string;
        milestoneId: string;
        grossAmount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
    }): Promise<{
        netToProvider: Prisma.Decimal;
        platformTotal: Prisma.Decimal;
        clientFee: Prisma.Decimal;
        providerFee: Prisma.Decimal;
    }>;
    recordProjectEscrowRefundToClientTx(tx: Prisma.TransactionClient, input: {
        clientUserId: string;
        projectId: string;
        paymentId: string;
        amount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
        disputeId?: string;
    }): Promise<void>;
    recordMilestoneRejectRefundTx(tx: Prisma.TransactionClient, input: {
        clientUserId: string;
        amount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
        milestoneId: string;
        projectId: string;
    }): Promise<void>;
    recordWithdrawalDebit(input: {
        userId: string;
        withdrawalId: string;
        amount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
    }): Promise<void>;
    recordWithdrawalDebitTx(tx: Prisma.TransactionClient, input: {
        userId: string;
        withdrawalId: string;
        amount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
    }): Promise<void>;
    refundWithdrawalHold(input: {
        userId: string;
        withdrawalId: string;
        amount: Prisma.Decimal;
        currency: PaymentCurrency;
        actorUserId: string;
    }): Promise<void>;
    private ensureUserWalletTx;
    private ensurePlatformWalletTx;
}
