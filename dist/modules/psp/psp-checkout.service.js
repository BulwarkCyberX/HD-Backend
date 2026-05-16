"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PspCheckoutService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const payments_service_1 = require("../payments/payments.service");
const payment_audit_service_1 = require("./payment-audit.service");
const razorpay_provider_1 = require("./providers/razorpay.provider");
const stripe_provider_1 = require("./providers/stripe.provider");
let PspCheckoutService = class PspCheckoutService {
    constructor(prisma, config, razorpay, stripe, audit, payments) {
        this.prisma = prisma;
        this.config = config;
        this.razorpay = razorpay;
        this.stripe = stripe;
        this.audit = audit;
        this.payments = payments;
    }
    resolveProvider(currency, preferred) {
        if (preferred === client_1.PspProviderName.STRIPE && this.stripe.isConfigured())
            return this.stripe;
        if (preferred === client_1.PspProviderName.RAZORPAY && this.razorpay.isConfigured())
            return this.razorpay;
        if (currency === client_1.PaymentCurrency.INR && this.razorpay.isConfigured())
            return this.razorpay;
        if (this.stripe.isConfigured())
            return this.stripe;
        if (this.razorpay.isConfigured())
            return this.razorpay;
        throw new common_1.ServiceUnavailableException('No payment provider configured');
    }
    async createCheckout(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can fund escrow');
        }
        if (input.amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can fund escrow');
        }
        if (!project.selectedProviderId) {
            throw new common_1.BadRequestException('Project must have selected provider before deposit');
        }
        const existingPayment = await this.prisma.payment.findUnique({
            where: { projectId: input.projectId },
            select: { id: true, status: true },
        });
        if (existingPayment?.status === client_1.PaymentStatus.IN_ESCROW || existingPayment?.status === client_1.PaymentStatus.RELEASED) {
            throw new common_1.BadRequestException('Payment already exists for this project');
        }
        const idempotencyKey = input.idempotencyKey?.trim() ||
            (0, crypto_1.createHash)('sha256')
                .update(`${input.requesterId}:${input.projectId}:${input.amount}:${input.currency}`)
                .digest('hex')
                .slice(0, 32);
        const existingSession = await this.prisma.pspCheckoutSession.findUnique({
            where: { idempotencyKey },
        });
        if (existingSession) {
            if (existingSession.status === client_1.PspCheckoutStatus.PAID) {
                throw new common_1.BadRequestException('Checkout already completed');
            }
            if (existingSession.providerOrderId && existingSession.status === client_1.PspCheckoutStatus.PENDING) {
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
                status: client_1.PspCheckoutStatus.PENDING,
                providerOrderId: order.providerOrderId,
                idempotencyKey,
                metadata: { amountMinor: order.amountMinor },
            },
            update: {
                providerOrderId: order.providerOrderId,
                status: client_1.PspCheckoutStatus.PENDING,
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
    async verifyClientPayment(input) {
        const session = await this.getSessionForPayer(input.sessionId, input.requesterId, input.role);
        const provider = this.getProviderByName(session.provider);
        if (!provider.verifyPaymentSignature({
            providerOrderId: input.providerOrderId,
            providerPaymentId: input.providerPaymentId,
            signature: input.signature,
        })) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        return this.finalizePaidSession(session.id, input.providerPaymentId, 'client.verify');
    }
    async handleRazorpayWebhook(rawBody, signature) {
        if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        const payload = JSON.parse(rawBody.toString('utf8'));
        const eventId = payload.id ?? (0, crypto_1.createHash)('sha256').update(rawBody).digest('hex');
        await this.audit.log({
            eventType: `webhook.${payload.event ?? 'unknown'}`,
            provider: client_1.PspProviderName.RAZORPAY,
            providerEventId: eventId,
            payload: payload,
        });
        const paymentEntity = payload.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id ?? payload.payload?.order?.entity?.id;
        const paymentId = paymentEntity?.id;
        if (!orderId)
            return { ok: true, skipped: true };
        const session = await this.prisma.pspCheckoutSession.findFirst({
            where: { providerOrderId: orderId },
        });
        if (!session)
            return { ok: true, skipped: true };
        if (payload.event === 'payment.failed') {
            await this.markFailed(session.id, 'Provider reported payment failure');
            return { ok: true };
        }
        if (payload.event === 'payment.captured' ||
            payload.event === 'order.paid' ||
            paymentEntity?.status === 'captured') {
            if (paymentId) {
                await this.finalizePaidSession(session.id, paymentId, 'webhook');
            }
        }
        return { ok: true };
    }
    async listTransactions(userId, role) {
        const where = role === client_1.UserRole.ADMIN
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
    async finalizePaidSession(sessionId, providerPaymentId, source) {
        const session = await this.prisma.pspCheckoutSession.findUnique({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Checkout session not found');
        if (session.status === client_1.PspCheckoutStatus.PAID) {
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
                status: client_1.PspCheckoutStatus.PAID,
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
    async markFailed(sessionId, reason) {
        await this.prisma.pspCheckoutSession.update({
            where: { id: sessionId },
            data: { status: client_1.PspCheckoutStatus.FAILED, failureReason: reason },
        });
        await this.audit.log({ sessionId, eventType: 'checkout.failed', payload: { reason } });
    }
    async getSessionForPayer(sessionId, requesterId, role) {
        const session = await this.prisma.pspCheckoutSession.findUnique({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Checkout session not found');
        if (role !== client_1.UserRole.ADMIN && session.payerId !== requesterId) {
            throw new common_1.ForbiddenException('Not allowed');
        }
        return session;
    }
    getProviderByName(name) {
        if (name === client_1.PspProviderName.RAZORPAY)
            return this.razorpay;
        if (name === client_1.PspProviderName.STRIPE)
            return this.stripe;
        throw new common_1.ServiceUnavailableException('Unknown provider');
    }
    toCheckoutResult(session, amountMinor) {
        const minor = amountMinor ??
            (session.currency === client_1.PaymentCurrency.INR ? Math.round(session.amount * 100) : Math.round(session.amount * 100));
        const publicKey = session.provider === client_1.PspProviderName.RAZORPAY
            ? this.razorpay.keyId()
            : (this.config.get('STRIPE_PUBLISHABLE_KEY') ?? '');
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
};
exports.PspCheckoutService = PspCheckoutService;
exports.PspCheckoutService = PspCheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        razorpay_provider_1.RazorpayProvider,
        stripe_provider_1.StripeProvider,
        payment_audit_service_1.PaymentAuditService,
        payments_service_1.PaymentsService])
], PspCheckoutService);
//# sourceMappingURL=psp-checkout.service.js.map