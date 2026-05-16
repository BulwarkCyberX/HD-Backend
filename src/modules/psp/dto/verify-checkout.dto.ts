import { IsString } from 'class-validator';

export class VerifyCheckoutDto {
  @IsString()
  sessionId!: string;

  @IsString()
  providerPaymentId!: string;

  @IsString()
  providerOrderId!: string;

  @IsString()
  signature!: string;
}
