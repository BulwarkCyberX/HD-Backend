"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsModule = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const platform_fee_service_1 = require("./platform-fee.service");
const wallets_controller_1 = require("./wallets.controller");
let WalletsModule = class WalletsModule {
};
exports.WalletsModule = WalletsModule;
exports.WalletsModule = WalletsModule = __decorate([
    (0, common_1.Module)({
        controllers: [wallets_controller_1.WalletsController],
        providers: [wallet_service_1.WalletService, platform_fee_service_1.PlatformFeeService],
        exports: [wallet_service_1.WalletService, platform_fee_service_1.PlatformFeeService],
    })
], WalletsModule);
//# sourceMappingURL=wallets.module.js.map