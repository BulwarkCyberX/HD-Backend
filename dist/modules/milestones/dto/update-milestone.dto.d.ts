import { PaymentCurrency } from '@prisma/client';
export declare class UpdateMilestoneDto {
    title?: string;
    description?: string;
    amount?: number;
    currency?: PaymentCurrency;
}
