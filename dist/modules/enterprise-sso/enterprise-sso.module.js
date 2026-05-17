"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseSsoModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../auth/auth.module");
const enterprise_sso_controller_1 = require("./enterprise-sso.controller");
const enterprise_sso_service_1 = require("./enterprise-sso.service");
let EnterpriseSsoModule = class EnterpriseSsoModule {
};
exports.EnterpriseSsoModule = EnterpriseSsoModule;
exports.EnterpriseSsoModule = EnterpriseSsoModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_ACCESS_SECRET') ?? 'change-me-access',
                }),
            }),
        ],
        controllers: [enterprise_sso_controller_1.EnterpriseSsoController],
        providers: [enterprise_sso_service_1.EnterpriseSsoService],
        exports: [enterprise_sso_service_1.EnterpriseSsoService],
    })
], EnterpriseSsoModule);
//# sourceMappingURL=enterprise-sso.module.js.map