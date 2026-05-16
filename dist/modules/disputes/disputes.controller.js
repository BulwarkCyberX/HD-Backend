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
exports.DisputesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const roles_guard_1 = require("../../auth/roles.guard");
const disputes_service_1 = require("./disputes.service");
const create_dispute_dto_1 = require("./dto/create-dispute.dto");
const dispute_comment_dto_1 = require("./dto/dispute-comment.dto");
const resolve_dispute_dto_1 = require("./dto/resolve-dispute.dto");
let DisputesController = class DisputesController {
    constructor(disputes) {
        this.disputes = disputes;
    }
    create(user, dto) {
        return this.disputes.create({
            requesterId: user.userId,
            role: user.role,
            projectId: dto.projectId,
            category: dto.category,
            title: dto.title,
            description: dto.description,
        });
    }
    listForProject(user, projectId) {
        return this.disputes.listForProject({ projectId, requesterId: user.userId, role: user.role });
    }
    listAdmin(user) {
        return this.disputes.listAdmin(user.role);
    }
    markReview(user, id) {
        return this.disputes.markReview({ disputeId: id, adminId: user.userId, role: user.role });
    }
    resolve(user, id, dto) {
        return this.disputes.resolve({
            disputeId: id,
            adminId: user.userId,
            role: user.role,
            status: dto.status,
            resolution: dto.resolution,
        });
    }
    addComment(user, id, dto) {
        return this.disputes.addComment({
            disputeId: id,
            requesterId: user.userId,
            role: user.role,
            body: dto.body,
            internal: dto.internal,
        });
    }
};
exports.DisputesController = DisputesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_dispute_dto_1.CreateDisputeDto]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "listForProject", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "listAdmin", null);
__decorate([
    (0, common_1.Patch)('admin/:id/review'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "markReview", null);
__decorate([
    (0, common_1.Patch)('admin/:id/resolve'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, resolve_dispute_dto_1.ResolveDisputeDto]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "resolve", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dispute_comment_dto_1.DisputeCommentDto]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "addComment", null);
exports.DisputesController = DisputesController = __decorate([
    (0, common_1.Controller)('disputes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [disputes_service_1.DisputesService])
], DisputesController);
//# sourceMappingURL=disputes.controller.js.map