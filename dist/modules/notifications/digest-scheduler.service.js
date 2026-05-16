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
var DigestSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigestSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const notifications_service_1 = require("./notifications.service");
let DigestSchedulerService = DigestSchedulerService_1 = class DigestSchedulerService {
    constructor(config, notifications) {
        this.config = config;
        this.notifications = notifications;
        this.logger = new common_1.Logger(DigestSchedulerService_1.name);
        this.timer = null;
        this.lastRunWeekKey = null;
    }
    onModuleInit() {
        if (this.config.get('ENABLE_WEEKLY_DIGEST_CRON') !== 'true') {
            return;
        }
        const hourUtc = Number(this.config.get('DIGEST_CRON_HOUR_UTC') ?? '9');
        this.logger.log(`Weekly digest cron enabled (Mondays ~${hourUtc}:00 UTC)`);
        this.timer = setInterval(() => void this.tick(hourUtc), 5 * 60 * 1000);
        setTimeout(() => void this.tick(hourUtc), 15_000);
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    weekKey(d = new Date()) {
        const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
        const week = Math.ceil((days + jan1.getUTCDay() + 1) / 7);
        return `${d.getUTCFullYear()}-W${week}`;
    }
    async tick(hourUtc) {
        const now = new Date();
        if (now.getUTCDay() !== 1)
            return;
        if (now.getUTCHours() !== hourUtc)
            return;
        const key = this.weekKey(now);
        if (this.lastRunWeekKey === key)
            return;
        this.lastRunWeekKey = key;
        try {
            const result = await this.notifications.sendWeeklyDigests();
            this.logger.log(`Weekly digest sent to ${result.sent} users`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Weekly digest cron failed: ${message}`);
        }
    }
};
exports.DigestSchedulerService = DigestSchedulerService;
exports.DigestSchedulerService = DigestSchedulerService = DigestSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        notifications_service_1.NotificationsService])
], DigestSchedulerService);
//# sourceMappingURL=digest-scheduler.service.js.map