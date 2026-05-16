import { type RequestUser } from '../../auth/current-user.decorator';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { VerifyCheckoutDto } from './dto/verify-checkout.dto';
import { PspCheckoutService } from './psp-checkout.service';
export declare class PspController {
    private readonly checkout;
    constructor(checkout: PspCheckoutService);
    createCheckout(user: RequestUser, dto: CreateCheckoutDto): Promise<import("./psp.types").CheckoutCreateResult>;
    verifyCheckout(user: RequestUser, dto: VerifyCheckoutDto): Promise<{
        session: {
            id: string;
            createdAt: Date;
            provider: import(".prisma/client").$Enums.PspProviderName;
            status: import(".prisma/client").$Enums.PspCheckoutStatus;
            projectId: string;
            payerId: string;
            amount: number;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
            updatedAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            paymentId: string | null;
            providerOrderId: string | null;
            idempotencyKey: string;
            providerPaymentId: string | null;
            failureReason: string | null;
            paidAt: Date | null;
        };
        payment: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            projectId: string;
            payerId: string;
            payeeId: string;
            amount: number;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
    }>;
    myTransactions(user: RequestUser): Promise<{
        payment: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
        } | null;
        id: string;
        createdAt: Date;
        provider: import(".prisma/client").$Enums.PspProviderName;
        status: import(".prisma/client").$Enums.PspCheckoutStatus;
        projectId: string;
        amount: number;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        providerOrderId: string | null;
        providerPaymentId: string | null;
        failureReason: string | null;
        paidAt: Date | null;
    }[]>;
}
