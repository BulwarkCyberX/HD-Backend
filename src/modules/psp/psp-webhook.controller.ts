import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PspCheckoutService } from './psp-checkout.service';

@Controller('payments/webhooks')
export class PspWebhookController {
  constructor(private readonly checkout: PspCheckoutService) {}

  @Post('razorpay')
  razorpay(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const raw = req.rawBody;
    if (!raw || !signature) {
      throw new BadRequestException('Missing webhook body or signature');
    }
    return this.checkout.handleRazorpayWebhook(raw, signature);
  }
}
