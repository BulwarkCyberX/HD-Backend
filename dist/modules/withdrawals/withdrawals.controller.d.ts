import { type RequestUser } from '../../auth/current-user.decorator';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
export declare class WithdrawalsController {
    private readonly withdrawals;
    constructor(withdrawals: WithdrawalsService);
    create(user: RequestUser, dto: CreateWithdrawalDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }>;
    listMine(user: RequestUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }[]>;
    listPending(user: RequestUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }[]>;
    approve(user: RequestUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }>;
    reject(user: RequestUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        updatedAt: Date;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }>;
}
