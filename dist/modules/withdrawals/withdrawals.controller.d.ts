import { type RequestUser } from '../../auth/current-user.decorator';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
export declare class WithdrawalsController {
    private readonly withdrawals;
    constructor(withdrawals: WithdrawalsService);
    create(user: RequestUser, dto: CreateWithdrawalDto): Promise<{
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }>;
    listMine(user: RequestUser): Promise<{
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }[]>;
    listPending(user: RequestUser): Promise<{
        user: {
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
        };
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }[]>;
    approve(user: RequestUser, id: string): Promise<{
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.WithdrawalRequestStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        reviewedAt: Date | null;
        adminReviewerId: string | null;
    }>;
    reject(user: RequestUser, id: string): Promise<{
        amount: import("@prisma/client/runtime/library").Decimal;
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
