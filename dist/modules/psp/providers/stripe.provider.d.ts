import { ConfigService } from '@nestjs/config';
import type { CreateProviderOrderInput, PaymentProviderAdapter, ProviderOrderResult, VerifyPaymentInput } from '../psp.types';
export declare class StripeProvider implements PaymentProviderAdapter {
    private readonly config;
    readonly name: "STRIPE";
    constructor(config: ConfigService);
    isConfigured(): boolean;
    createOrder(input: CreateProviderOrderInput): Promise<ProviderOrderResult>;
    verifyPaymentSignature(_input: VerifyPaymentInput): boolean;
    verifyWebhookSignature(_rawBody: Buffer, _signature: string): boolean;
}
