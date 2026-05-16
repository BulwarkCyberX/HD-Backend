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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const integrations_service_1 = require("./integrations.service");
const create_api_key_dto_1 = require("./dto/create-api-key.dto");
const create_webhook_dto_1 = require("./dto/create-webhook.dto");
const patch_webhook_dto_1 = require("./dto/patch-webhook.dto");
let IntegrationsController = class IntegrationsController {
    constructor(integrations) {
        this.integrations = integrations;
    }
    listApiKeys(user) {
        return this.integrations.listApiKeys(user.userId);
    }
    createApiKey(user, dto) {
        return this.integrations.createApiKey(user.userId, dto.label);
    }
    revokeApiKey(user, id) {
        return this.integrations.revokeApiKey(user.userId, id);
    }
    listWebhooks(user) {
        return this.integrations.listWebhooks(user.userId);
    }
    createWebhook(user, dto) {
        return this.integrations.createWebhook(user.userId, dto);
    }
    patchWebhook(user, id, dto) {
        return this.integrations.setWebhookEnabled(user.userId, id, dto.enabled);
    }
    deleteWebhook(user, id) {
        return this.integrations.deleteWebhook(user.userId, id);
    }
    listDeliveries(user, id) {
        return this.integrations.listDeliveries(user.userId, id);
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)('api-keys'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "listApiKeys", null);
__decorate([
    (0, common_1.Post)('api-keys'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_api_key_dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "createApiKey", null);
__decorate([
    (0, common_1.Delete)('api-keys/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "revokeApiKey", null);
__decorate([
    (0, common_1.Get)('webhooks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "listWebhooks", null);
__decorate([
    (0, common_1.Post)('webhooks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_webhook_dto_1.CreateWebhookDto]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "createWebhook", null);
__decorate([
    (0, common_1.Patch)('webhooks/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, patch_webhook_dto_1.PatchWebhookDto]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "patchWebhook", null);
__decorate([
    (0, common_1.Delete)('webhooks/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "deleteWebhook", null);
__decorate([
    (0, common_1.Get)('webhooks/:id/deliveries'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "listDeliveries", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, swagger_1.ApiTags)('integrations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('integrations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map