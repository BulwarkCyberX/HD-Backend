"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BountyModule = void 0;
const common_1 = require("@nestjs/common");
const bounty_controller_1 = require("./bounty.controller");
const bounty_service_1 = require("./bounty.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const notifications_module_1 = require("../notifications/notifications.module");
let BountyModule = class BountyModule {
};
exports.BountyModule = BountyModule;
exports.BountyModule = BountyModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, notifications_module_1.NotificationsModule],
        controllers: [bounty_controller_1.BountyController],
        providers: [bounty_service_1.BountyService],
        exports: [bounty_service_1.BountyService],
    })
], BountyModule);
//# sourceMappingURL=bounty.module.js.map