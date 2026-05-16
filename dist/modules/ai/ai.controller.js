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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const ai_service_1 = require("./ai.service");
const scope_dto_1 = require("./dto/scope.dto");
const proposal_dto_1 = require("./dto/proposal.dto");
const report_review_dto_1 = require("./dto/report-review.dto");
const risk_dto_1 = require("./dto/risk.dto");
const duplicate_dto_1 = require("./dto/duplicate.dto");
let AiController = class AiController {
    constructor(ai) {
        this.ai = ai;
    }
    scope(user, dto) {
        return this.ai.suggestScope(dto.description, user.userId);
    }
    proposal(user, dto) {
        return this.ai.improveProposal(dto.proposal, user.userId);
    }
    reportReview(user, dto) {
        return this.ai.reviewReport({
            title: dto.title,
            description: dto.description,
            severity: dto.severity,
        }, user.userId);
    }
    risk(user, dto) {
        return this.ai.classifyRisk({ title: dto.title, description: dto.description }, user.userId);
    }
    duplicate(user, dto) {
        return this.ai.duplicateHint(dto.a, dto.b, user.userId);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('scope'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, scope_dto_1.AiScopeDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "scope", null);
__decorate([
    (0, common_1.Post)('proposal'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, proposal_dto_1.AiProposalDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "proposal", null);
__decorate([
    (0, common_1.Post)('report-review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_review_dto_1.AiReportReviewDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "reportReview", null);
__decorate([
    (0, common_1.Post)('risk'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, risk_dto_1.AiRiskDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "risk", null);
__decorate([
    (0, common_1.Post)('duplicate-hint'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, duplicate_dto_1.AiDuplicateDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "duplicate", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map