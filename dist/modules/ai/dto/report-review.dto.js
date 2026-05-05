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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiReportReviewDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class AiReportReviewDto {
    title;
    description;
    severity;
}
exports.AiReportReviewDto = AiReportReviewDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], AiReportReviewDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(50000),
    __metadata("design:type", String)
], AiReportReviewDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ReportSeverity),
    __metadata("design:type", String)
], AiReportReviewDto.prototype, "severity", void 0);
//# sourceMappingURL=report-review.dto.js.map