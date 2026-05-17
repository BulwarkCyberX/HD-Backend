"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const session_service_1 = require("./session.service");
const jwt_strategy_1 = require("./jwt.strategy");
const roles_guard_1 = require("../../auth/roles.guard");
const oauth_strategies_providers_1 = require("./oauth-strategies.providers");
const email_module_1 = require("../email/email.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            email_module_1.EmailModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const expiresIn = (config.get('JWT_ACCESS_EXPIRES') ?? '15m');
                    return {
                        secret: config.get('JWT_ACCESS_SECRET') ?? 'change-me-access',
                        signOptions: { expiresIn },
                    };
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, session_service_1.SessionService, jwt_strategy_1.JwtStrategy, roles_guard_1.RolesGuard, ...oauth_strategies_providers_1.oauthStrategyProviders],
        exports: [jwt_1.JwtModule, roles_guard_1.RolesGuard, session_service_1.SessionService, auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map