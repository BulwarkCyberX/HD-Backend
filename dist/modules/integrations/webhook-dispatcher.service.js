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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookDispatcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookDispatcherService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const webhook_delivery_service_1 = require("./webhook-delivery.service");
let WebhookDispatcherService = WebhookDispatcherService_1 = class WebhookDispatcherService {
    constructor(prisma, delivery, webhookQueue) {
        this.prisma = prisma;
        this.delivery = delivery;
        this.webhookQueue = webhookQueue;
        this.logger = new common_1.Logger(WebhookDispatcherService_1.name);
    }
    async dispatchTest(userId, endpointId) {
        const endpoint = await this.prisma.webhookEndpoint.findFirst({
            where: { id: endpointId, userId, enabled: true },
            select: { id: true, events: true },
        });
        if (!endpoint)
            return;
        const event = endpoint.events[0] ?? client_1.WebhookEventType.BID_ACCEPTED;
        const payload = {
            id: (0, crypto_1.randomBytes)(12).toString('hex'),
            event,
            createdAt: new Date().toISOString(),
            data: { test: true, message: 'HackersDeal webhook connectivity test' },
        };
        await this.enqueue(endpoint.id, event, payload);
    }
    async replayDelivery(endpointId, event, payload) {
        const p = payload;
        await this.enqueue(endpointId, event, p);
    }
    async dispatch(userId, event, data) {
        const endpoints = await this.prisma.webhookEndpoint.findMany({
            where: { userId, enabled: true, events: { has: event } },
            select: { id: true },
        });
        if (endpoints.length === 0)
            return;
        const payload = {
            id: (0, crypto_1.randomBytes)(12).toString('hex'),
            event,
            createdAt: new Date().toISOString(),
            data,
        };
        for (const endpoint of endpoints) {
            await this.enqueue(endpoint.id, event, payload);
        }
    }
    async enqueue(endpointId, event, payload) {
        const job = { endpointId, event, payload, attempt: 1 };
        try {
            await this.webhookQueue.add('deliver', job, {
                attempts: 4,
                backoff: { type: 'exponential', delay: 5_000 },
                removeOnComplete: 100,
                removeOnFail: 200,
            });
        }
        catch (err) {
            this.logger.warn(`Webhook queue unavailable, delivering inline: ${err instanceof Error ? err.message : String(err)}`);
            void this.delivery.deliver(job).catch(() => undefined);
        }
    }
};
exports.WebhookDispatcherService = WebhookDispatcherService;
exports.WebhookDispatcherService = WebhookDispatcherService = WebhookDispatcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('webhooks')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        webhook_delivery_service_1.WebhookDeliveryService,
        bullmq_2.Queue])
], WebhookDispatcherService);
//# sourceMappingURL=webhook-dispatcher.service.js.map