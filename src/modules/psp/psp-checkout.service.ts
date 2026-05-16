import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentCurrency,
  PaymentStatus,
  PspCheckoutStatus,
  PspProviderName,
  UserRole,
  type Prisma,
} from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentAuditService } from './payment-audit.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { StripeProvider } from './providers/stripe.provider';
import type { CheckoutCreateResult, PaymentProviderAdapter } from './psp.types';

@Injectable()
export class PspCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly razorpay: RazorpayProvider,
    private readonly stripe: StripeProvider,
    private readonly audit: PaymentAuditService,
    private readonly payments: PaymentsService,
  ) {}

  private resolveProvider(currency: PaymentCurrency, preferred?: PspProviderName): PaymentProviderAdapter {
    if (preferred === PspProviderName.STRIPE && this.stripe.isConfigured()) return this.stripe;
    if (preferred === PspProviderName.RAZORPAY && this.razorpay.isConfigured()) return this.razorpay;
    if (currency === PaymentCurrency.INR && this.razorpay.isConfigured()) return this.razorpay;
    if (this.stripe.isConfigured()) return this.stripe;
    if (this.razorpay.isConfigured()) return this.razorpay;
    throw new ServiceUnavailableException('No payment provider configured');
  }

  async createCheckout(input: {
    requesterId: string;
    role: UserRole;
    projectId: string;
    amount: number;
    currency: PaymentCurrency;
    idempotencyKey?: string;
    preferredProvider?: PspProviderName;
  }): Promise<CheckoutCreateResult> {
    if (input.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can fund escrow');
    }
    if (input.amount <= 0) throw new BadRequestException('Amount must be positive');

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, clientId: true, selectedProviderId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== input.requesterId) {
      throw new ForbiddenException('Only project owner can fund escrow');
    }
    if (!project.selectedProviderId) {
      throw new BadRequestException('Project must have selected provider before deposit');
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { projectId: input.projectId },
      select: { id: true, status: true },
    });
    if (existingPayment?.status === PaymentStatus.IN_ESCROW || existingPayment?.status === PaymentStatus.RELEASED) {
      throw new BadRequestException('Payment already exists for this project');
    }

    const idempotencyKey =
      input.idempotencyKey?.trim() ||
      createHash('sha256')
        .update(`${input.requesterId}:${input.projectId}:${input.amount}:${input.currency}`)
        .digest('hex')
        .slice(0, 32);

    const existingSession = await this.prisma.pspCheckoutSession.findUnique({
      where: { idempotencyKey },
    });
    if (existingSession) {
      if (existingSession.status === PspCheckoutStatus.PAID) {
        throw new BadRequestException('Checkout already completed');
      }
      if (existingSession.providerOrderId && existingSession.status === PspCheckoutStatus.PENDING) {
        return this.toCheckoutResult(existingSession);
      }
    }

    const provider = this.resolveProvider(input.currency, input.preferredProvider);
    const order = await provider.createOrder({
      amount: input.amount,
      currency: input.currency,
      receipt: idempotencyKey,
      notes: { projectId: input.projectId, payerId: input.requesterId },
    });

    const session = await this.prisma.pspCheckoutSession.upsert({
      where: { idempotencyKey },
      create: {
        projectId: input.projectId,
        payerId: input.requesterId,
        amount: input.amount,
        currency: input.currency,
        provider: provider.name,
        status: PspCheckoutStatus.PENDING,
        providerOrderId: order.providerOrderId,
        idempotencyKey,
        metadata: { amountMinor: order.amountMinor } as Prisma.InputJsonValue,
      },
      update: {
        providerOrderId: order.providerOrderId,
        status: PspCheckoutStatus.PENDING,
        failureReason: null,
      },
    });

    await this.audit.log({
      sessionId: session.id,
      eventType: 'checkout.created',
      provider: provider.name,
      actorUserId: input.requesterId,
      payload: { providerOrderId: order.providerOrderId, amount: input.amount },
    });

    return this.toCheckoutResult(session, order.amountMinor);
  }

  async verifyClientPayment(input: {
    requesterId: string;
    role: UserRole;
    sessionId: string;
    providerPaymentId: string;
    providerOrderId: string;
    signature: string;
  }) {
    const session = await this.getSessionForPayer(input.sessionId, input.requesterId, input.role);
    const provider = this.getProviderByName(session.provider);
    if (!provider.verifyPaymentSignature({
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      signature: input.signature,
    })) {
      throw new BadRequestException('Invalid payment signature');
    }
    return this.finalizePaidSession(session.id, input.providerPaymentId, 'client.verify');
  }

  async handleRazorpayWebhook(rawBody: Buffer, signature: string) {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
    const payload = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      id?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; status?: string } };
        order?: { entity?: { id?: string } };
      };
    };
    const eventId = payload.id ?? createHash('sha256').update(rawBody).digest('hex');
    await this.audit.log({
      eventType: `webhook.${payload.event ?? 'unknown'}`,
      provider: PspProviderName.RAZORPAY,
      providerEventId: eventId,
      payload: payload as Prisma.InputJsonValue,
    });

    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id ?? payload.payload?.order?.entity?.id;
    const paymentId = paymentEntity?.id;
    if (!orderId) return { ok: true, skipped: true };

    const session = await this.prisma.pspCheckoutSession.findFirst({
      where: { providerOrderId: orderId },
    });
    if (!session) return { ok: true, skipped: true };

    if (payload.event === 'payment.failed') {
      await this.markFailed(session.id, 'Provider reported payment failure');
      return { ok: true };
    }

    if (
      payload.event === 'payment.captured' ||
      payload.event === 'order.paid' ||
      paymentEntity?.status === 'captured'
    ) {
      if (paymentId) {
        await this.finalizePaidSession(session.id, paymentId, 'webhook');
      }
    }
    return { ok: true };
  }

  async listTransactions(userId: string, role: UserRole) {
    const where =
      role === UserRole.ADMIN
        ? {}
        : {
            OR: [{ payerId: userId }, { project: { selectedProviderId: userId } }],
          };
    return this.prisma.pspCheckoutSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        projectId: true,
        amount: true,
        currency: true,
        provider: true,
        status: true,
        providerOrderId: true,
        providerPaymentId: true,
        failureReason: true,
        paidAt: true,
        createdAt: true,
        payment: { select: { id: true, status: true } },
      },
    });
  }

  private async finalizePaidSession(sessionId: string, providerPaymentId: string, source: string) {
    const session = await this.prisma.pspCheckoutSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Checkout session not found');
    if (session.status === PspCheckoutStatus.PAID) {
      return { session, payment: await this.prisma.payment.findUnique({ where: { projectId: session.projectId } }) };
    }

    const payment = await this.payments.depositFromPsp({
      requesterId: session.payerId,
      projectId: session.projectId,
      amount: session.amount,
      currency: session.currency,
    });

    const updated = await this.prisma.pspCheckoutSession.update({
      where: { id: sessionId },
      data: {
        status: PspCheckoutStatus.PAID,
        providerPaymentId,
        paidAt: new Date(),
        paymentId: payment.id,
      },
    });

    await this.audit.log({
      sessionId,
      eventType: 'checkout.paid',
      provider: session.provider,
      providerEventId: `${source}:${providerPaymentId}`,
      actorUserId: session.payerId,
      payload: { paymentId: payment.id, source },
    });

    return { session: updated, payment };
  }

  private async markFailed(sessionId: string, reason: string) {
    await this.prisma.pspCheckoutSession.update({
      where: { id: sessionId },
      data: { status: PspCheckoutStatus.FAILED, failureReason: reason },
    });
    await this.audit.log({ sessionId, eventType: 'checkout.failed', payload: { reason } });
  }

  private async getSessionForPayer(sessionId: string, requesterId: string, role: UserRole) {
    const session = await this.prisma.pspCheckoutSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Checkout session not found');
    if (role !== UserRole.ADMIN && session.payerId !== requesterId) {
      throw new ForbiddenException('Not allowed');
    }
    return session;
  }

  private getProviderByName(name: PspProviderName): PaymentProviderAdapter {
    if (name === PspProviderName.RAZORPAY) return this.razorpay;
    if (name === PspProviderName.STRIPE) return this.stripe;
    throw new ServiceUnavailableException('Unknown provider');
  }

  private toCheckoutResult(
    session: {
      id: string;
      provider: PspProviderName;
      providerOrderId: string | null;
      amount: number;
      currency: PaymentCurrency;
      idempotencyKey: string;
    },
    amountMinor?: number,
  ): CheckoutCreateResult {
    const minor =
      amountMinor ??
      (session.currency === PaymentCurrency.INR ? Math.round(session.amount * 100) : Math.round(session.amount * 100));
    const publicKey =
      session.provider === PspProviderName.RAZORPAY
        ? this.razorpay.keyId()
        : (this.config.get<string>('STRIPE_PUBLISHABLE_KEY') ?? '');
    return {
      sessionId: session.id,
      provider: session.provider,
      providerOrderId: session.providerOrderId ?? '',
      amount: session.amount,
      currency: session.currency,
      amountMinor: minor,
      publicKey,
      idempotencyKey: session.idempotencyKey,
    };
  }
}
