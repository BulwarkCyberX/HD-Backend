import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { PaymentCurrency } from '@prisma/client';

export class CreateWithdrawalDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentCurrency)
  currency!: PaymentCurrency;
}
