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
exports.HourlyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_guard_1 = require("../../auth/roles.guard");
const hourly_service_1 = require("./hourly.service");
const upsert_engagement_dto_1 = require("./dto/upsert-engagement.dto");
const create_time_entry_dto_1 = require("./dto/create-time-entry.dto");
const update_time_entry_dto_1 = require("./dto/update-time-entry.dto");
const reject_time_entry_dto_1 = require("./dto/reject-time-entry.dto");
const set_engagement_status_dto_1 = require("./dto/set-engagement-status.dto");
let HourlyController = class HourlyController {
    constructor(hourly) {
        this.hourly = hourly;
    }
    getByProject(user, projectId) {
        return this.hourly.getByProject({ projectId, requesterId: user.userId, role: user.role });
    }
    getSummary(user, projectId) {
        return this.hourly.getProjectSummary({ projectId, requesterId: user.userId, role: user.role });
    }
    setEngagementStatus(user, projectId, dto) {
        return this.hourly.setEngagementStatus({
            requesterId: user.userId,
            role: user.role,
            projectId,
            status: dto.status,
        });
    }
    upsertEngagement(user, projectId, dto) {
        return this.hourly.upsertEngagement({
            requesterId: user.userId,
            role: user.role,
            projectId,
            hourlyRate: dto.hourlyRate,
            weeklyCapHours: dto.weeklyCapHours,
            currency: dto.currency,
        });
    }
    createEntry(user, dto) {
        return this.hourly.createTimeEntry({
            requesterId: user.userId,
            role: user.role,
            engagementId: dto.engagementId,
            workDate: dto.workDate,
            hours: dto.hours,
            description: dto.description,
        });
    }
    updateEntry(user, id, dto) {
        return this.hourly.updateTimeEntry({
            requesterId: user.userId,
            role: user.role,
            entryId: id,
            workDate: dto.workDate,
            hours: dto.hours,
            description: dto.description,
        });
    }
    submitEntry(user, id) {
        return this.hourly.submitTimeEntry({ requesterId: user.userId, role: user.role, entryId: id });
    }
    approveEntry(user, id) {
        return this.hourly.approveTimeEntry({ requesterId: user.userId, role: user.role, entryId: id });
    }
    rejectEntry(user, id, dto) {
        return this.hourly.rejectTimeEntry({
            requesterId: user.userId,
            role: user.role,
            entryId: id,
            reason: dto.reason,
        });
    }
    billEntry(user, id) {
        return this.hourly.billTimeEntry({ requesterId: user.userId, role: user.role, entryId: id });
    }
};
exports.HourlyController = HourlyController;
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "getByProject", null);
__decorate([
    (0, common_1.Get)('project/:projectId/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Patch)('project/:projectId/engagement/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, set_engagement_status_dto_1.SetEngagementStatusDto]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "setEngagementStatus", null);
__decorate([
    (0, common_1.Post)('project/:projectId/engagement'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, upsert_engagement_dto_1.UpsertHourlyEngagementDto]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "upsertEngagement", null);
__decorate([
    (0, common_1.Post)('time-entries'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_time_entry_dto_1.CreateTimeEntryDto]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "createEntry", null);
__decorate([
    (0, common_1.Patch)('time-entries/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_time_entry_dto_1.UpdateTimeEntryDto]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "updateEntry", null);
__decorate([
    (0, common_1.Post)('time-entries/:id/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "submitEntry", null);
__decorate([
    (0, common_1.Post)('time-entries/:id/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "approveEntry", null);
__decorate([
    (0, common_1.Post)('time-entries/:id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reject_time_entry_dto_1.RejectTimeEntryDto]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "rejectEntry", null);
__decorate([
    (0, common_1.Post)('time-entries/:id/bill'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HourlyController.prototype, "billEntry", null);
exports.HourlyController = HourlyController = __decorate([
    (0, swagger_1.ApiTags)('hourly'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('hourly'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [hourly_service_1.HourlyService])
], HourlyController);
//# sourceMappingURL=hourly.controller.js.map