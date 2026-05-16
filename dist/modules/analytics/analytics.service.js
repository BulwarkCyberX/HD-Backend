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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async adminSummary() {
        const [users, projects, payments, disputes, pendingKyc, pendingWithdrawals, projectsByStatus] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.project.count(),
            this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: client_1.PaymentStatus.RELEASED } }),
            this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
            this.prisma.kycSubmission.count({ where: { status: 'PENDING' } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
            this.prisma.project.groupBy({ by: ['status'], _count: { id: true } }),
        ]);
        const platform = await this.prisma.platformWallet.findFirst({
            select: { availableBalance: true, lifetimeEarnings: true, currency: true },
        });
        return {
            users,
            projects,
            releasedPaymentsGross: payments._sum.amount ?? 0,
            activeDisputes: disputes,
            pendingKyc,
            pendingWithdrawals,
            projectsByStatus: projectsByStatus.map((r) => ({ status: r.status, count: r._count.id })),
            platformWallet: platform
                ? {
                    availableBalance: platform.availableBalance.toString(),
                    lifetimeEarnings: platform.lifetimeEarnings.toString(),
                    currency: platform.currency,
                }
                : null,
        };
    }
    async providerFor(userId) {
        const profile = await this.prisma.providerProfile.findUnique({
            where: { userId },
            select: {
                rating: true,
                totalReviews: true,
                completedProjects: true,
                validReportCount: true,
                reputationScore: true,
            },
        });
        const bids = await this.prisma.bid.count({ where: { providerId: userId } });
        const wallet = await this.prisma.userWallet.findUnique({
            where: { userId },
            select: {
                availableBalance: true,
                lifetimeEarnings: true,
                escrowBalance: true,
                totalSpent: true,
                currency: true,
            },
        });
        return {
            profile,
            bidsSubmitted: bids,
            wallet: wallet
                ? {
                    availableBalance: wallet.availableBalance.toString(),
                    lifetimeEarnings: wallet.lifetimeEarnings.toString(),
                    escrowBalance: wallet.escrowBalance.toString(),
                    totalSpent: wallet.totalSpent.toString(),
                    currency: wallet.currency,
                }
                : null,
        };
    }
    async clientFor(userId) {
        const projects = await this.prisma.project.count({ where: { clientId: userId } });
        const wallet = await this.prisma.userWallet.findUnique({
            where: { userId },
            select: {
                availableBalance: true,
                escrowBalance: true,
                totalSpent: true,
                currency: true,
            },
        });
        return {
            projectsOwned: projects,
            wallet: wallet
                ? {
                    availableBalance: wallet.availableBalance.toString(),
                    escrowBalance: wallet.escrowBalance.toString(),
                    totalSpent: wallet.totalSpent.toString(),
                    currency: wallet.currency,
                }
                : null,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map