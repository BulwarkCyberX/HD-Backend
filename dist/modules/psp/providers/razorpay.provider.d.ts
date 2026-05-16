import { ConfigService } from '@nestjs/config';
import type { CreateProviderOrderInput, PaymentProviderAdapter, ProviderOrderResult, VerifyPaymentInput } from '../psp.types';
export declare class RazorpayProvider implements PaymentProviderAdapter {
    private readonly config;
    readonly name: "RAZORPAY";
    constructor(config: ConfigService);
    isConfigured(): boolean;
    keyId(): string;
    private keySecret;
    private webhookSecret;
    createOrder(input: CreateProviderOrderInput): Promise<ProviderOrderResult>;
    verifyPaymentSignature(input: VerifyPaymentInput): boolean;
    verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
    private safeEqual;
}
