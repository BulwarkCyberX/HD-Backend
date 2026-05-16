import { PaymentCurrency } from '@prisma/client';
export declare class CreateWithdrawalDto {
    amount: number;
    currency: PaymentCurrency;
}
