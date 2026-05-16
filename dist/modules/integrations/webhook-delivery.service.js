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
var WebhookDeliveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookDeliveryService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
let WebhookDeliveryService = WebhookDeliveryService_1 = class WebhookDeliveryService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhookDeliveryService_1.name);
    }
    async deliver(job) {
        const endpoint = await this.prisma.webhookEndpoint.findUnique({
            where: { id: job.endpointId },
            select: { id: true, url: true, secret: true, enabled: true },
        });
        if (!endpoint?.enabled) {
            return { success: true, skipped: true };
        }
        const body = JSON.stringify(job.payload);
        const signature = (0, crypto_1.createHmac)('sha256', endpoint.secret).update(body).digest('hex');
        let statusCode = null;
        let success = false;
        let errorMessage = null;
        try {
            const res = await fetch(endpoint.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-HackersDeal-Event': job.event,
                    'X-HackersDeal-Signature': `sha256=${signature}`,
                    'X-HackersDeal-Delivery-Attempt': String(job.attempt),
                },
                body,
                signal: AbortSignal.timeout(12_000),
            });
            statusCode = res.status;
            success = res.ok;
            if (!res.ok) {
                errorMessage = `HTTP ${res.status}`;
                throw new Error(errorMessage);
            }
        }
        catch (err) {
            errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Webhook ${endpoint.id} attempt ${job.attempt} failed: ${errorMessage}`);
            await this.prisma.webhookDelivery.create({
                data: {
                    endpointId: endpoint.id,
                    event: job.event,
                    payload: { ...job.payload, attempt: job.attempt },
                    statusCode: statusCode ?? undefined,
                    success: false,
                    errorMessage,
                },
            });
            throw err;
        }
        await this.prisma.webhookDelivery.create({
            data: {
                endpointId: endpoint.id,
                event: job.event,
                payload: { ...job.payload, attempt: job.attempt },
                statusCode: statusCode ?? undefined,
                success: true,
            },
        });
        return { success: true };
    }
};
exports.WebhookDeliveryService = WebhookDeliveryService;
exports.WebhookDeliveryService = WebhookDeliveryService = WebhookDeliveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhookDeliveryService);
//# sourceMappingURL=webhook-delivery.service.js.map