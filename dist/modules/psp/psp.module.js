"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PspModule = void 0;
const common_1 = require("@nestjs/common");
const payments_module_1 = require("../payments/payments.module");
const payment_audit_service_1 = require("./payment-audit.service");
const psp_checkout_service_1 = require("./psp-checkout.service");
const psp_controller_1 = require("./psp.controller");
const psp_webhook_controller_1 = require("./psp-webhook.controller");
const razorpay_provider_1 = require("./providers/razorpay.provider");
const stripe_provider_1 = require("./providers/stripe.provider");
let PspModule = class PspModule {
};
exports.PspModule = PspModule;
exports.PspModule = PspModule = __decorate([
    (0, common_1.Module)({
        imports: [payments_module_1.PaymentsModule],
        controllers: [psp_controller_1.PspController, psp_webhook_controller_1.PspWebhookController],
        providers: [psp_checkout_service_1.PspCheckoutService, payment_audit_service_1.PaymentAuditService, razorpay_provider_1.RazorpayProvider, stripe_provider_1.StripeProvider],
        exports: [psp_checkout_service_1.PspCheckoutService, payment_audit_service_1.PaymentAuditService],
    })
], PspModule);
//# sourceMappingURL=psp.module.js.map