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
exports.SubmitKycDto = void 0;
const class_validator_1 = require("class-validator");
class SubmitKycDto {
}
exports.SubmitKycDto = SubmitKycDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 10),
    (0, class_validator_1.Matches)(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, { message: 'Invalid PAN format' }),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "panNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "panHolderName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 18),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(11, 11),
    (0, class_validator_1.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/i, { message: 'Invalid IFSC format' }),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "bankIfsc", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "bankAccountHolder", void 0);
//# sourceMappingURL=submit-kyc.dto.js.map