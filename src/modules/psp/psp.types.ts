import type { PaymentCurrency, PspProviderName } from '@prisma/client';

export type CreateProviderOrderInput = {
  amount: number;
  currency: PaymentCurrency;
  receipt: string;
  notes?: Record<string, string>;
};

export type ProviderOrderResult = {
  providerOrderId: string;
  amountMinor: number;
  currency: PaymentCurrency;
  raw?: unknown;
};

export type VerifyPaymentInput = {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
};

export interface PaymentProviderAdapter {
  readonly name: PspProviderName;
  isConfigured(): boolean;
  createOrder(input: CreateProviderOrderInput): Promise<ProviderOrderResult>;
  verifyPaymentSignature(input: VerifyPaymentInput): boolean;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}

export type CheckoutCreateResult = {
  sessionId: string;
  provider: PspProviderName;
  providerOrderId: string;
  amount: number;
  currency: PaymentCurrency;
  amountMinor: number;
  publicKey: string;
  idempotencyKey: string;
};
