import { ConfigService } from '@nestjs/config';
import { PaymentCurrency, PspProviderName, UserRole, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentAuditService } from './payment-audit.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { StripeProvider } from './providers/stripe.provider';
import type { CheckoutCreateResult } from './psp.types';
export declare class PspCheckoutService {
    private readonly prisma;
    private readonly config;
    private readonly razorpay;
    private readonly stripe;
    private readonly audit;
    private readonly payments;
    constructor(prisma: PrismaService, config: ConfigService, razorpay: RazorpayProvider, stripe: StripeProvider, audit: PaymentAuditService, payments: PaymentsService);
    private resolveProvider;
    createCheckout(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        amount: number;
        currency: PaymentCurrency;
        idempotencyKey?: string;
        preferredProvider?: PspProviderName;
    }): Promise<CheckoutCreateResult>;
    verifyClientPayment(input: {
        requesterId: string;
        role: UserRole;
        sessionId: string;
        providerPaymentId: string;
        providerOrderId: string;
        signature: string;
    }): Promise<{
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
            metadata: Prisma.JsonValue | null;
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
    handleRazorpayWebhook(rawBody: Buffer, signature: string): Promise<{
        ok: boolean;
        skipped: boolean;
    } | {
        ok: boolean;
        skipped?: undefined;
    }>;
    listTransactions(userId: string, role: UserRole): Promise<{
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
    private finalizePaidSession;
    private markFailed;
    private getSessionForPayer;
    private getProviderByName;
    private toCheckoutResult;
}
