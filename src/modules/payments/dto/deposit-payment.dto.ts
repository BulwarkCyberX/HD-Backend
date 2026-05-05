import { IsEnum, IsNumber, IsString, Min, MinLength } from 'class-validator';
import { PaymentCurrency } from '@prisma/client';

export class DepositPaymentDto {
  @IsString()
  @MinLength(1)
  projectId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsEnum(PaymentCurrency)
  currency: PaymentCurrency = PaymentCurrency.INR;
}
