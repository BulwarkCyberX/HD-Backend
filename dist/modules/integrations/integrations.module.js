"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const integrations_controller_1 = require("./integrations.controller");
const v1_controller_1 = require("./v1.controller");
const integrations_service_1 = require("./integrations.service");
const webhook_dispatcher_service_1 = require("./webhook-dispatcher.service");
const webhook_delivery_service_1 = require("./webhook-delivery.service");
const webhook_processor_1 = require("./webhook.processor");
const api_key_guard_1 = require("./api-key.guard");
const api_key_rate_limit_guard_1 = require("./api-key-rate-limit.guard");
const prisma_module_1 = require("../../prisma/prisma.module");
const reports_module_1 = require("../reports/reports.module");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, bullmq_1.BullModule.registerQueue({ name: 'webhooks' }), (0, common_1.forwardRef)(() => reports_module_1.ReportsModule)],
        controllers: [integrations_controller_1.IntegrationsController, v1_controller_1.V1Controller],
        providers: [
            integrations_service_1.IntegrationsService,
            webhook_delivery_service_1.WebhookDeliveryService,
            webhook_dispatcher_service_1.WebhookDispatcherService,
            webhook_processor_1.WebhookProcessor,
            api_key_guard_1.ApiKeyGuard,
            api_key_rate_limit_guard_1.ApiKeyRateLimitGuard,
        ],
        exports: [integrations_service_1.IntegrationsService, webhook_dispatcher_service_1.WebhookDispatcherService],
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map