import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PaymentCurrency } from '@prisma/client';

export class UpsertHourlyEngagementDto {
  @IsNumber()
  @Min(0.01)
  hourlyRate!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  weeklyCapHours?: number;

  @IsOptional()
  @IsEnum(PaymentCurrency)
  currency?: PaymentCurrency;
}
