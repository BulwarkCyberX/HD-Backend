import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentCurrency, PspProviderName } from '@prisma/client';
import type {
  CreateProviderOrderInput,
  PaymentProviderAdapter,
  ProviderOrderResult,
  VerifyPaymentInput,
} from '../psp.types';

/** Stripe adapter stub — enable when STRIPE_SECRET_KEY is configured. */
@Injectable()
export class StripeProvider implements PaymentProviderAdapter {
  readonly name = PspProviderName.STRIPE;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('STRIPE_SECRET_KEY'));
  }

  async createOrder(input: CreateProviderOrderInput): Promise<ProviderOrderResult> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
    const secret = this.config.get<string>('STRIPE_SECRET_KEY')!;
    const currency = input.currency === PaymentCurrency.INR ? 'inr' : 'usd';
    const amountMinor = Math.round(input.amount * 100);
    const params = new URLSearchParams();
    params.set('amount', String(amountMinor));
    params.set('currency', currency);
    params.set('automatic_payment_methods[enabled]', 'true');
    params.set('metadata[receipt]', input.receipt);

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const json = (await res.json()) as { id?: string; client_secret?: string; error?: { message?: string } };
    if (!res.ok || !json.id) {
      throw new ServiceUnavailableException(json.error?.message ?? 'Failed to create Stripe payment intent');
    }
    return {
      providerOrderId: json.id,
      amountMinor,
      currency: input.currency,
      raw: json,
    };
  }

  verifyPaymentSignature(_input: VerifyPaymentInput): boolean {
    return false;
  }

  verifyWebhookSignature(_rawBody: Buffer, _signature: string): boolean {
    return false;
  }
}
