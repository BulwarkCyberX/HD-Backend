"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const email_module_1 = require("../email/email.module");
const bids_module_1 = require("../bids/bids.module");
const analytics_module_1 = require("../analytics/analytics.module");
const trust_module_1 = require("../trust/trust.module");
const admin_controller_1 = require("./admin.controller");
const admin_projects_service_1 = require("./admin-projects.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [email_module_1.EmailModule, bids_module_1.BidsModule, analytics_module_1.AnalyticsModule, trust_module_1.TrustModule],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_projects_service_1.AdminProjectsService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map