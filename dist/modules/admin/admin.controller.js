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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const roles_decorator_1 = require("../../auth/roles.decorator");
const roles_guard_1 = require("../../auth/roles.guard");
const email_template_service_1 = require("../email/email-template.service");
const admin_projects_service_1 = require("./admin-projects.service");
const bids_service_1 = require("../bids/bids.service");
const analytics_service_1 = require("../analytics/analytics.service");
const update_email_template_dto_1 = require("./dto/update-email-template.dto");
const admin_update_project_dto_1 = require("./dto/admin-update-project.dto");
let AdminController = class AdminController {
    constructor(emailTemplates, adminProjects, bids, analytics) {
        this.emailTemplates = emailTemplates;
        this.adminProjects = adminProjects;
        this.bids = bids;
        this.analytics = analytics;
    }
    overview() {
        return {
            sections: [
                { id: 'projects', label: 'Projects', href: '/dashboard/admin/projects' },
                { id: 'reports', label: 'Report triage', href: '/dashboard/admin/reports' },
                { id: 'disputes', label: 'Disputes', href: '/dashboard/admin/disputes' },
                { id: 'kyc', label: 'KYC queue', href: '/dashboard/admin/kyc' },
                { id: 'emails', label: 'Email templates', href: '/dashboard/admin/emails' },
                { id: 'analytics', label: 'Analytics', href: '/dashboard/admin/analytics' },
                { id: 'settings', label: 'Platform settings', href: '/dashboard/admin/settings' },
            ],
        };
    }
    analyticsSummary() {
        return this.analytics.adminSummary();
    }
    listEmailTemplates() {
        return this.emailTemplates.list();
    }
    sampleVariables(key) {
        return this.emailTemplates.sampleVariables(key);
    }
    getEmailTemplate(key) {
        return this.emailTemplates.getByKey(key);
    }
    updateEmailTemplate(user, key, dto) {
        return this.emailTemplates.update(key, {
            ...dto,
            preheader: dto.preheader === undefined ? undefined : dto.preheader || null,
            updatedById: user.userId,
        });
    }
    previewEmailTemplate(key, body) {
        const vars = body?.variables ?? this.emailTemplates.sampleVariables(key);
        return this.emailTemplates.preview(key, vars);
    }
    listProjects(status, visibility, q) {
        return this.adminProjects.list({ status, visibility, q });
    }
    getProject(id) {
        return this.adminProjects.getById(id);
    }
    updateProject(id, dto) {
        return this.adminProjects.update(id, {
            ...dto,
            selectedProviderId: dto.selectedProviderId === undefined ? undefined : dto.selectedProviderId || null,
        });
    }
    acceptBid(bidId) {
        return this.bids.acceptBidAsAdmin(bidId);
    }
    projectFinancials(id) {
        return this.adminProjects.getFinancials(id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('analytics/summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "analyticsSummary", null);
__decorate([
    (0, common_1.Get)('email-templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listEmailTemplates", null);
__decorate([
    (0, common_1.Get)('email-templates/:key/variables'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "sampleVariables", null);
__decorate([
    (0, common_1.Get)('email-templates/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getEmailTemplate", null);
__decorate([
    (0, common_1.Patch)('email-templates/:key'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('key')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_email_template_dto_1.UpdateEmailTemplateDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateEmailTemplate", null);
__decorate([
    (0, common_1.Post)('email-templates/:key/preview'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "previewEmailTemplate", null);
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('visibility')),
    __param(2, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listProjects", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getProject", null);
__decorate([
    (0, common_1.Patch)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_update_project_dto_1.AdminUpdateProjectDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateProject", null);
__decorate([
    (0, common_1.Post)('projects/:projectId/bids/:bidId/accept'),
    __param(0, (0, common_1.Param)('bidId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "acceptBid", null);
__decorate([
    (0, common_1.Get)('projects/:id/financials'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "projectFinancials", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [email_template_service_1.EmailTemplateService,
        admin_projects_service_1.AdminProjectsService,
        bids_service_1.BidsService,
        analytics_service_1.AnalyticsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map