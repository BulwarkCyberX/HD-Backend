import { PaymentCurrency } from '@prisma/client';
export declare class UpsertHourlyEngagementDto {
    hourlyRate: number;
    weeklyCapHours?: number;
    currency?: PaymentCurrency;
}
