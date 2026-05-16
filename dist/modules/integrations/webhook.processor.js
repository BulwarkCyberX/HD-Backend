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
var WebhookProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const webhook_delivery_service_1 = require("./webhook-delivery.service");
let WebhookProcessor = WebhookProcessor_1 = class WebhookProcessor extends bullmq_1.WorkerHost {
    constructor(delivery) {
        super();
        this.delivery = delivery;
        this.logger = new common_1.Logger(WebhookProcessor_1.name);
    }
    async process(job) {
        this.logger.debug(`Processing webhook job ${job.id} attempt ${job.attemptsMade + 1}`);
        return this.delivery.deliver({
            ...job.data,
            attempt: job.attemptsMade + 1,
        });
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = WebhookProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('webhooks'),
    __metadata("design:paramtypes", [webhook_delivery_service_1.WebhookDeliveryService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map