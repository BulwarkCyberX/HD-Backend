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
exports.VdpController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const roles_decorator_1 = require("../../auth/roles.decorator");
const roles_guard_1 = require("../../auth/roles.guard");
const create_vdp_dto_1 = require("./dto/create-vdp.dto");
const vdp_report_dto_1 = require("./dto/vdp-report.dto");
const vdp_service_1 = require("./vdp.service");
let VdpController = class VdpController {
    vdp;
    constructor(vdp) {
        this.vdp = vdp;
    }
    create(user, dto) {
        return this.vdp.create({
            clientId: user.userId,
            role: user.role,
            title: dto.title,
            scope: dto.scope,
            policy: dto.policy,
        });
    }
    getById(id) {
        return this.vdp.getPublic(id);
    }
    submitReport(dto) {
        return this.vdp.submitReport({
            vdpId: dto.vdpId,
            title: dto.title,
            description: dto.description,
            contactEmail: dto.contactEmail,
            severity: dto.severity,
        });
    }
};
exports.VdpController = VdpController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CLIENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_vdp_dto_1.CreateVdpDto]),
    __metadata("design:returntype", void 0)
], VdpController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VdpController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)('report'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vdp_report_dto_1.VdpReportDto]),
    __metadata("design:returntype", void 0)
], VdpController.prototype, "submitReport", null);
exports.VdpController = VdpController = __decorate([
    (0, common_1.Controller)('vdp'),
    __metadata("design:paramtypes", [vdp_service_1.VdpService])
], VdpController);
//# sourceMappingURL=vdp.controller.js.map