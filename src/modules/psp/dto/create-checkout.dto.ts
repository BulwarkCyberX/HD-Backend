import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentCurrency, PspProviderName } from '@prisma/client';

export class CreateCheckoutDto {
  @IsString()
  projectId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsEnum(PaymentCurrency)
  currency!: PaymentCurrency;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsEnum(PspProviderName)
  preferredProvider?: PspProviderName;
}
