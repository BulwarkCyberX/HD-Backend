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
exports.RazorpayProvider = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
let RazorpayProvider = class RazorpayProvider {
    constructor(config) {
        this.config = config;
        this.name = client_1.PspProviderName.RAZORPAY;
    }
    isConfigured() {
        return Boolean(this.keyId() && this.keySecret());
    }
    keyId() {
        return this.config.get('RAZORPAY_KEY_ID') ?? '';
    }
    keySecret() {
        return this.config.get('RAZORPAY_KEY_SECRET') ?? '';
    }
    webhookSecret() {
        return this.config.get('RAZORPAY_WEBHOOK_SECRET') ?? this.keySecret();
    }
    async createOrder(input) {
        if (!this.isConfigured()) {
            throw new common_1.ServiceUnavailableException('Razorpay is not configured');
        }
        if (input.currency !== client_1.PaymentCurrency.INR) {
            throw new common_1.ServiceUnavailableException('Razorpay checkout supports INR only');
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
        const json = (await res.json());
        if (!res.ok || !json.id) {
            throw new common_1.ServiceUnavailableException(json.error?.description ?? 'Failed to create Razorpay order');
        }
        return {
            providerOrderId: json.id,
            amountMinor,
            currency: client_1.PaymentCurrency.INR,
            raw: json,
        };
    }
    verifyPaymentSignature(input) {
        const secret = this.keySecret();
        if (!secret)
            return false;
        const payload = `${input.providerOrderId}|${input.providerPaymentId}`;
        const expected = (0, crypto_1.createHmac)('sha256', secret).update(payload).digest('hex');
        return this.safeEqual(expected, input.signature);
    }
    verifyWebhookSignature(rawBody, signature) {
        const secret = this.webhookSecret();
        if (!secret || !signature)
            return false;
        const expected = (0, crypto_1.createHmac)('sha256', secret).update(rawBody).digest('hex');
        return this.safeEqual(expected, signature);
    }
    safeEqual(a, b) {
        try {
            const ba = Buffer.from(a);
            const bb = Buffer.from(b);
            if (ba.length !== bb.length)
                return false;
            return (0, crypto_1.timingSafeEqual)(ba, bb);
        }
        catch {
            return false;
        }
    }
};
exports.RazorpayProvider = RazorpayProvider;
exports.RazorpayProvider = RazorpayProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayProvider);
//# sourceMappingURL=razorpay.provider.js.map