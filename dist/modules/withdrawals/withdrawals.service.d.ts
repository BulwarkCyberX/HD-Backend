import { Prisma, UserRole, type PaymentCurrency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
import { KycService } from '../kyc/kyc.service';
export declare class WithdrawalsService {
    private readonly prisma;
    private readonly wallets;
    private readonly kyc;
    constructor(prisma: PrismaService, wallets: WalletService, kyc: KycService);
    private readonly select;
    create(input: {
        userId: string;
        role: UserRole;
        amount: number;
        currency: PaymentCurrency;
    }): Promise<{
        amount: Prisma.Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }>;
    listMine(userId: string): Promise<{
        amount: Prisma.Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }[]>;
    listPendingAdmin(requesterRole: UserRole): Promise<{
        user: {
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
        };
        amount: Prisma.Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }[]>;
    approve(input: {
        adminId: string;
        role: UserRole;
        withdrawalId: string;
    }): Promise<{
        amount: Prisma.Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }>;
    reject(input: {
        adminId: string;
        role: UserRole;
        withdrawalId: string;
    }): Promise<{
        amount: Prisma.Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }>;
}
