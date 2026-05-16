import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PspCheckoutService } from './psp-checkout.service';
export declare class PspWebhookController {
    private readonly checkout;
    constructor(checkout: PspCheckoutService);
    razorpay(req: RawBodyRequest<Request>, signature: string): Promise<{
        ok: boolean;
        skipped: boolean;
    } | {
        ok: boolean;
        skipped?: undefined;
    }>;
}
