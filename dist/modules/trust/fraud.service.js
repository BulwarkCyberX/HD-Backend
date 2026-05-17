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
var FraudService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const BID_VELOCITY_LIMIT_PER_HOUR = 20;
const REPORT_VELOCITY_LIMIT_PER_HOUR = 15;
let FraudService = FraudService_1 = class FraudService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(FraudService_1.name);
    }
    async checkBidVelocity(providerId) {
        const since = new Date(Date.now() - 60 * 60 * 1000);
        const count = await this.prisma.bid.count({
            where: { providerId, createdAt: { gte: since } },
        });
        if (count > BID_VELOCITY_LIMIT_PER_HOUR) {
            await this.flagUser(providerId, 'HIGH_BID_VELOCITY', {
                bidsLastHour: count,
                limit: BID_VELOCITY_LIMIT_PER_HOUR,
            });
            this.logger.warn(`Fraud flag: provider ${providerId} bid velocity ${count}/h`);
        }
        return count;
    }
    async checkReportVelocity(providerId) {
        const since = new Date(Date.now() - 60 * 60 * 1000);
        const count = await this.prisma.report.count({
            where: { submittedBy: providerId, createdAt: { gte: since } },
        });
        if (count > REPORT_VELOCITY_LIMIT_PER_HOUR) {
            await this.flagUser(providerId, 'HIGH_REPORT_VELOCITY', {
                reportsLastHour: count,
                limit: REPORT_VELOCITY_LIMIT_PER_HOUR,
            });
        }
        return count;
    }
    async clearFlag(userId, actorId) {
        const existing = await this.prisma.fraudFlag.findUnique({ where: { userId } });
        if (!existing)
            throw new common_1.NotFoundException('Fraud flag not found');
        await this.prisma.fraudFlag.update({
            where: { userId },
            data: {
                score: 0,
                reasons: {
                    entries: [{ reason: 'CLEARED_BY_ADMIN', actorId, at: new Date().toISOString() }],
                },
            },
        });
        return { ok: true };
    }
    async listFlaggedUsers(limit = 50) {
        return this.prisma.fraudFlag.findMany({
            where: { score: { gte: 10 } },
            orderBy: { score: 'desc' },
            take: limit,
            select: {
                id: true,
                userId: true,
                score: true,
                reasons: true,
                updatedAt: true,
                user: { select: { email: true, role: true } },
            },
        });
    }
    async flagUser(userId, reason, detail) {
        const existing = await this.prisma.fraudFlag.findUnique({ where: { userId } });
        const reasons = existing?.reasons?.entries ?? [];
        const nextReasons = [...(Array.isArray(reasons) ? reasons : []), { reason, detail, at: new Date().toISOString() }];
        await this.prisma.fraudFlag.upsert({
            where: { userId },
            create: {
                userId,
                score: 10,
                reasons: { entries: nextReasons },
            },
            update: {
                score: { increment: 5 },
                reasons: { entries: nextReasons.slice(-20) },
            },
        });
    }
};
exports.FraudService = FraudService;
exports.FraudService = FraudService = FraudService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FraudService);
//# sourceMappingURL=fraud.service.js.map