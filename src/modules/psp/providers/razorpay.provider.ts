import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentCurrency, PspProviderName } from '@prisma/client';
import type {
  CreateProviderOrderInput,
  PaymentProviderAdapter,
  ProviderOrderResult,
  VerifyPaymentInput,
} from '../psp.types';

@Injectable()
export class RazorpayProvider implements PaymentProviderAdapter {
  readonly name = PspProviderName.RAZORPAY;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.keyId() && this.keySecret());
  }

  keyId(): string {
    return this.config.get<string>('RAZORPAY_KEY_ID') ?? '';
  }

  private keySecret(): string {
    return this.config.get<string>('RAZORPAY_KEY_SECRET') ?? '';
  }

  private webhookSecret(): string {
    return this.config.get<string>('RAZORPAY_WEBHOOK_SECRET') ?? this.keySecret();
  }

  async createOrder(input: CreateProviderOrderInput): Promise<ProviderOrderResult> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Razorpay is not configured');
    }
    if (input.currency !== PaymentCurrency.INR) {
      throw new ServiceUnavailableException('Razorpay checkout supports INR only');
    }
    const amountMinor = Math.round(input.amount * 100);
    const auth = Buffer.from(`${this.keyId()}:${this.keySecret()}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountMinor,
        currency: 'INR',
        receipt: input.receipt.slice(0, 40),
        notes: input.notes ?? {},
      }),
    });
    const json = (await res.json()) as { id?: string; error?: { description?: string } };
    if (!res.ok || !json.id) {
      throw new ServiceUnavailableException(
        json.error?.description ?? 'Failed to create Razorpay order',
      );
    }
    return {
      providerOrderId: json.id,
      amountMinor,
      currency: PaymentCurrency.INR,
      raw: json,
    };
  }

  verifyPaymentSignature(input: VerifyPaymentInput): boolean {
    const secret = this.keySecret();
    if (!secret) return false;
    const payload = `${input.providerOrderId}|${input.providerPaymentId}`;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    return this.safeEqual(expected, input.signature);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = this.webhookSecret();
    if (!secret || !signature) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return this.safeEqual(expected, signature);
  }

  private safeEqual(a: string, b: string): boolean {
    try {
      const ba = Buffer.from(a);
      const bb = Buffer.from(b);
      if (ba.length !== bb.length) return false;
      return timingSafeEqual(ba, bb);
    } catch {
      return false;
    }
  }
}
