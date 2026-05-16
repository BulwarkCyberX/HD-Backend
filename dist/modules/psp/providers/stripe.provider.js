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
exports.StripeProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
let StripeProvider = class StripeProvider {
    constructor(config) {
        this.config = config;
        this.name = client_1.PspProviderName.STRIPE;
    }
    isConfigured() {
        return Boolean(this.config.get('STRIPE_SECRET_KEY'));
    }
    async createOrder(input) {
        if (!this.isConfigured()) {
            throw new common_1.ServiceUnavailableException('Stripe is not configured');
        }
        const secret = this.config.get('STRIPE_SECRET_KEY');
        const currency = input.currency === client_1.PaymentCurrency.INR ? 'inr' : 'usd';
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
        const json = (await res.json());
        if (!res.ok || !json.id) {
            throw new common_1.ServiceUnavailableException(json.error?.message ?? 'Failed to create Stripe payment intent');
        }
        return {
            providerOrderId: json.id,
            amountMinor,
            currency: input.currency,
            raw: json,
        };
    }
    verifyPaymentSignature(_input) {
        return false;
    }
    verifyWebhookSignature(_rawBody, _signature) {
        return false;
    }
};
exports.StripeProvider = StripeProvider;
exports.StripeProvider = StripeProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeProvider);
//# sourceMappingURL=stripe.provider.js.map