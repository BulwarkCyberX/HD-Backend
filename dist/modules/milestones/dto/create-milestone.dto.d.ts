import { PaymentCurrency } from '@prisma/client';
export declare class CreateMilestoneDto {
    projectId: string;
    title: string;
    description?: string;
    amount: number;
    currency: PaymentCurrency;
    sortOrder?: number;
}
