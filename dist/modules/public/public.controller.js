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
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const public_service_1 = require("./public.service");
let PublicController = class PublicController {
    constructor(pub) {
        this.pub = pub;
    }
    listProjects(q, minBudget, maxBudget, budgetType, skill, sort) {
        return this.pub.listPublicProjects({
            q,
            minBudget: minBudget ? Number(minBudget) : undefined,
            maxBudget: maxBudget ? Number(maxBudget) : undefined,
            budgetType,
            skill,
            sort: sort ?? 'newest',
        });
    }
    getProject(id) {
        return this.pub.getPublicProject(id);
    }
    featuredProviders() {
        return this.pub.listFeaturedProviders();
    }
    getProvider(id) {
        return this.pub.getPublicProvider(id);
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('minBudget')),
    __param(2, (0, common_1.Query)('maxBudget')),
    __param(3, (0, common_1.Query)('budgetType')),
    __param(4, (0, common_1.Query)('skill')),
    __param(5, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "listProjects", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "getProject", null);
__decorate([
    (0, common_1.Get)('providers/featured/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "featuredProviders", null);
__decorate([
    (0, common_1.Get)('providers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "getProvider", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [public_service_1.PublicService])
], PublicController);
//# sourceMappingURL=public.controller.js.map