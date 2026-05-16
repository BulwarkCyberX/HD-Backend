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
exports.MilestonesController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_guard_1 = require("../../auth/roles.guard");
const milestones_service_1 = require("./milestones.service");
const create_milestone_dto_1 = require("./dto/create-milestone.dto");
const update_milestone_dto_1 = require("./dto/update-milestone.dto");
const approve_milestone_dto_1 = require("./dto/approve-milestone.dto");
const milestone_comment_dto_1 = require("./dto/milestone-comment.dto");
let MilestonesController = class MilestonesController {
    constructor(milestones) {
        this.milestones = milestones;
    }
    listByProject(user, projectId) {
        return this.milestones.listByProject({
            projectId,
            requesterId: user.userId,
            role: user.role,
        });
    }
    create(user, dto) {
        return this.milestones.create({
            requesterId: user.userId,
            role: user.role,
            projectId: dto.projectId,
            title: dto.title,
            description: dto.description ?? '',
            amount: dto.amount,
            currency: dto.currency,
            sortOrder: dto.sortOrder ?? 0,
        });
    }
    update(user, id, dto) {
        return this.milestones.update({
            requesterId: user.userId,
            role: user.role,
            milestoneId: id,
            title: dto.title,
            description: dto.description,
            amount: dto.amount,
            currency: dto.currency,
        });
    }
    remove(user, id) {
        return this.milestones.remove({ requesterId: user.userId, role: user.role, milestoneId: id });
    }
    fund(user, id) {
        return this.milestones.fund({ requesterId: user.userId, role: user.role, milestoneId: id });
    }
    start(user, id) {
        return this.milestones.startProgress({ requesterId: user.userId, role: user.role, milestoneId: id });
    }
    submit(user, id) {
        return this.milestones.submit({ requesterId: user.userId, role: user.role, milestoneId: id });
    }
    approve(user, id, dto) {
        return this.milestones.approve({
            requesterId: user.userId,
            role: user.role,
            milestoneId: id,
            partialPercent: dto.partialPercent,
        });
    }
    release(user, id) {
        return this.milestones.release({ requesterId: user.userId, role: user.role, milestoneId: id });
    }
    reject(user, id) {
        return this.milestones.reject({ requesterId: user.userId, role: user.role, milestoneId: id });
    }
    listComments(user, id) {
        return this.milestones.listComments({
            milestoneId: id,
            requesterId: user.userId,
            role: user.role,
        });
    }
    addComment(user, id, dto) {
        return this.milestones.addComment({
            milestoneId: id,
            requesterId: user.userId,
            role: user.role,
            body: dto.body,
        });
    }
};
exports.MilestonesController = MilestonesController;
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "listByProject", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_milestone_dto_1.CreateMilestoneDto]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_milestone_dto_1.UpdateMilestoneDto]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/fund'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "fund", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, approve_milestone_dto_1.ApproveMilestoneDto]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/release'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "release", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "listComments", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, milestone_comment_dto_1.CreateMilestoneCommentDto]),
    __metadata("design:returntype", void 0)
], MilestonesController.prototype, "addComment", null);
exports.MilestonesController = MilestonesController = __decorate([
    (0, common_1.Controller)('milestones'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [milestones_service_1.MilestonesService])
], MilestonesController);
//# sourceMappingURL=milestones.controller.js.map