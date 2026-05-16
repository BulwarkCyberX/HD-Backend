import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentAuditService } from './payment-audit.service';
import { PspCheckoutService } from './psp-checkout.service';
import { PspController } from './psp.controller';
import { PspWebhookController } from './psp-webhook.controller';
import { RazorpayProvider } from './providers/razorpay.provider';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  imports: [PaymentsModule],
  controllers: [PspController, PspWebhookController],
  providers: [PspCheckoutService, PaymentAuditService, RazorpayProvider, StripeProvider],
  exports: [PspCheckoutService, PaymentAuditService],
})
export class PspModule {}
