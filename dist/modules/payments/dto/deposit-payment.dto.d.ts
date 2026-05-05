import { PaymentCurrency } from '@prisma/client';
export declare class DepositPaymentDto {
    projectId: string;
    amount: number;
    currency: PaymentCurrency;
}
