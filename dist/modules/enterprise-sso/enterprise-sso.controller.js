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
exports.EnterpriseSsoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const enterprise_sso_service_1 = require("./enterprise-sso.service");
let EnterpriseSsoController = class EnterpriseSsoController {
    constructor(sso) {
        this.sso = sso;
    }
    publicStatus(slug) {
        return this.sso.getPublicStatus(slug);
    }
    async startLogin(slug, next, res) {
        const url = await this.sso.startLogin(slug, next);
        res.redirect(url);
    }
    async callback(slug, code, state, res) {
        if (!code || !state) {
            const web = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
            res.redirect(`${web}/auth/login?error=sso_missing_params`);
            return;
        }
        const redirectUrl = await this.sso.handleCallback(slug, code, state);
        res.redirect(redirectUrl);
    }
};
exports.EnterpriseSsoController = EnterpriseSsoController;
__decorate([
    (0, common_1.Get)('public/enterprise/:slug/sso'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EnterpriseSsoController.prototype, "publicStatus", null);
__decorate([
    (0, common_1.Get)('auth/enterprise/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('next')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EnterpriseSsoController.prototype, "startLogin", null);
__decorate([
    (0, common_1.Get)('auth/enterprise/:slug/callback'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], EnterpriseSsoController.prototype, "callback", null);
exports.EnterpriseSsoController = EnterpriseSsoController = __decorate([
    (0, swagger_1.ApiTags)('enterprise-sso'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [enterprise_sso_service_1.EnterpriseSsoService])
], EnterpriseSsoController);
//# sourceMappingURL=enterprise-sso.controller.js.map