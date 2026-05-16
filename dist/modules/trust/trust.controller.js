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
exports.TrustController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_guard_1 = require("../../auth/roles.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const trust_service_1 = require("./trust.service");
const moderation_audit_dto_1 = require("./dto/moderation-audit.dto");
let TrustController = class TrustController {
    constructor(trust) {
        this.trust = trust;
    }
    audit(user, dto) {
        return this.trust.logModeration({
            actorId: user.userId,
            action: dto.action,
            targetType: dto.targetType,
            targetId: dto.targetId,
            metadata: dto.metadata,
        });
    }
};
exports.TrustController = TrustController;
__decorate([
    (0, common_1.Post)('moderation-audit'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, moderation_audit_dto_1.ModerationAuditDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "audit", null);
exports.TrustController = TrustController = __decorate([
    (0, common_1.Controller)('trust'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [trust_service_1.TrustService])
], TrustController);
//# sourceMappingURL=trust.controller.js.map