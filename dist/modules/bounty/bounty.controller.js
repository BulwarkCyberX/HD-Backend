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
exports.BountyController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const roles_decorator_1 = require("../../auth/roles.decorator");
const roles_guard_1 = require("../../auth/roles.guard");
const bounty_service_1 = require("./bounty.service");
const create_program_dto_1 = require("./dto/create-program.dto");
const create_bug_report_dto_1 = require("./dto/create-bug-report.dto");
const update_bug_report_status_dto_1 = require("./dto/update-bug-report-status.dto");
let BountyController = class BountyController {
    bounty;
    constructor(bounty) {
        this.bounty = bounty;
    }
    createProgram(user, dto) {
        return this.bounty.createProgram({
            clientId: user.userId,
            role: user.role,
            title: dto.title,
            description: dto.description ?? '',
            scope: dto.scope,
            rewardTable: dto.rewardTable,
            status: dto.status,
            allowedResearcherIds: dto.allowedResearcherIds,
        });
    }
    listPrograms(user) {
        return this.bounty.listPrograms({ requesterId: user.userId, role: user.role });
    }
    getProgram(user, id) {
        return this.bounty.getProgram({ id, requesterId: user.userId, role: user.role });
    }
    submitReport(user, dto) {
        return this.bounty.createBugReport({
            researcherId: user.userId,
            role: user.role,
            programId: dto.programId,
            title: dto.title,
            description: dto.description,
            severity: dto.severity,
        });
    }
    listReports(user, programId) {
        return this.bounty.listReportsForProgram({
            programId,
            requesterId: user.userId,
            role: user.role,
        });
    }
    updateReportStatus(user, id, dto) {
        return this.bounty.updateBugReportStatus({
            reportId: id,
            requesterId: user.userId,
            role: user.role,
            status: dto.status,
        });
    }
};
exports.BountyController = BountyController;
__decorate([
    (0, common_1.Post)('programs'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CLIENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_program_dto_1.CreateProgramDto]),
    __metadata("design:returntype", void 0)
], BountyController.prototype, "createProgram", null);
__decorate([
    (0, common_1.Get)('programs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BountyController.prototype, "listPrograms", null);
__decorate([
    (0, common_1.Get)('programs/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BountyController.prototype, "getProgram", null);
__decorate([
    (0, common_1.Post)('reports'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PROVIDER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_bug_report_dto_1.CreateBugReportDto]),
    __metadata("design:returntype", void 0)
], BountyController.prototype, "submitReport", null);
__decorate([
    (0, common_1.Get)('reports/:programId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('programId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BountyController.prototype, "listReports", null);
__decorate([
    (0, common_1.Patch)('reports/:id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_bug_report_status_dto_1.UpdateBugReportStatusDto]),
    __metadata("design:returntype", void 0)
], BountyController.prototype, "updateReportStatus", null);
exports.BountyController = BountyController = __decorate([
    (0, common_1.Controller)('bounty'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [bounty_service_1.BountyService])
], BountyController);
//# sourceMappingURL=bounty.controller.js.map