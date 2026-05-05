"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const entities_module_1 = require("./modules/entities/entities.module");
const projects_module_1 = require("./modules/projects/projects.module");
const bids_module_1 = require("./modules/bids/bids.module");
const payments_module_1 = require("./modules/payments/payments.module");
const messages_module_1 = require("./modules/messages/messages.module");
const reports_module_1 = require("./modules/reports/reports.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const bounty_module_1 = require("./modules/bounty/bounty.module");
const vdp_module_1 = require("./modules/vdp/vdp.module");
const files_module_1 = require("./modules/files/files.module");
const ai_module_1 = require("./modules/ai/ai.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            entities_module_1.EntitiesModule,
            projects_module_1.ProjectsModule,
            bids_module_1.BidsModule,
            messages_module_1.MessagesModule,
            reports_module_1.ReportsModule,
            reviews_module_1.ReviewsModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            bounty_module_1.BountyModule,
            vdp_module_1.VdpModule,
            files_module_1.FilesModule,
            ai_module_1.AiModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map