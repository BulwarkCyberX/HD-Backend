import { PaymentCurrency, PspProviderName } from '@prisma/client';
export declare class CreateCheckoutDto {
    projectId: string;
    amount: number;
    currency: PaymentCurrency;
    idempotencyKey?: string;
    preferredProvider?: PspProviderName;
}
