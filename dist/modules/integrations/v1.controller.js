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
exports.V1Controller = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_key_guard_1 = require("./api-key.guard");
const api_key_rate_limit_guard_1 = require("./api-key-rate-limit.guard");
const integrations_service_1 = require("./integrations.service");
const api_scopes_1 = require("./api-scopes");
const v1_create_report_dto_1 = require("./dto/v1-create-report.dto");
let V1Controller = class V1Controller {
    constructor(integrations) {
        this.integrations = integrations;
    }
    userId(req) {
        const id = req.apiUser?.userId;
        if (!id)
            throw new common_1.UnauthorizedException('API user missing');
        return id;
    }
    listProjects(req, cursor, limit) {
        return this.integrations.listProjectsForApiUser(this.userId(req), cursor, limit ? Number(limit) : undefined);
    }
    getProject(req, id) {
        return this.integrations.getProjectForApiUser(this.userId(req), id);
    }
    listReports(req, id) {
        return this.integrations.listReportsForApiUser(this.userId(req), id);
    }
    listMilestones(req, id) {
        return this.integrations.listMilestonesForApiUser(this.userId(req), id);
    }
    createReport(req, id, dto) {
        (0, api_scopes_1.requireApiScope)(req.apiUser?.scopes ?? [], 'write:reports');
        return this.integrations.createReportForApiUser(this.userId(req), id, dto);
    }
};
exports.V1Controller = V1Controller;
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], V1Controller.prototype, "listProjects", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], V1Controller.prototype, "getProject", null);
__decorate([
    (0, common_1.Get)('projects/:id/reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], V1Controller.prototype, "listReports", null);
__decorate([
    (0, common_1.Get)('projects/:id/milestones'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], V1Controller.prototype, "listMilestones", null);
__decorate([
    (0, common_1.Post)('projects/:id/reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, v1_create_report_dto_1.V1CreateReportDto]),
    __metadata("design:returntype", void 0)
], V1Controller.prototype, "createReport", null);
exports.V1Controller = V1Controller = __decorate([
    (0, swagger_1.ApiTags)('v1'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, swagger_1.ApiHeader)({ name: 'X-API-Key', description: 'API key from /integrations/api-keys' }),
    (0, common_1.Controller)('v1'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard, api_key_rate_limit_guard_1.ApiKeyRateLimitGuard),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], V1Controller);
//# sourceMappingURL=v1.controller.js.map