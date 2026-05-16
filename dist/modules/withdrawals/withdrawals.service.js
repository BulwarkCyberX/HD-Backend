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
exports.WithdrawalsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallets/wallet.service");
const kyc_service_1 = require("../kyc/kyc.service");
let WithdrawalsService = class WithdrawalsService {
    constructor(prisma, wallets, kyc) {
        this.prisma = prisma;
        this.wallets = wallets;
        this.kyc = kyc;
        this.select = {
            id: true,
            userId: true,
            amount: true,
            currency: true,
            status: true,
            adminReviewerId: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
        };
    }
    async create(input) {
        if (input.role === client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Admins use separate payout tooling');
        }
        await this.kyc.assertWithdrawalAllowed(input.userId);
        const amt = new client_1.Prisma.Decimal(String(input.amount));
        const wallet = await this.wallets.ensureUserWallet(input.userId, input.currency);
        if (wallet.availableBalance.lt(amt)) {
            throw new common_1.BadRequestException('Insufficient available balance for withdrawal');
        }
        return this.prisma.withdrawalRequest.create({
            data: {
                userId: input.userId,
                amount: amt,
                currency: input.currency,
                status: client_1.WithdrawalRequestStatus.PENDING,
            },
            select: this.select,
        });
    }
    async listMine(userId) {
        return this.prisma.withdrawalRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: this.select,
        });
    }
    async listPendingAdmin(requesterRole) {
        if (requesterRole !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        return this.prisma.withdrawalRequest.findMany({
            where: { status: client_1.WithdrawalRequestStatus.PENDING },
            orderBy: { createdAt: 'asc' },
            select: {
                ...this.select,
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }
    async approve(input) {
        if (input.role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        const w = await this.prisma.withdrawalRequest.findUnique({
            where: { id: input.withdrawalId },
            select: this.select,
        });
        if (!w)
            throw new common_1.NotFoundException('Withdrawal not found');
        if (w.status !== client_1.WithdrawalRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Withdrawal is not pending');
        }
        return this.prisma.$transaction(async (tx) => {
            await this.wallets.recordWithdrawalDebitTx(tx, {
                userId: w.userId,
                withdrawalId: w.id,
                amount: new client_1.Prisma.Decimal(w.amount.toString()),
                currency: w.currency,
                actorUserId: input.adminId,
            });
            return tx.withdrawalRequest.update({
                where: { id: w.id },
                data: {
                    status: client_1.WithdrawalRequestStatus.PAID,
                    adminReviewerId: input.adminId,
                    reviewedAt: new Date(),
                },
                select: this.select,
            });
        });
    }
    async reject(input) {
        if (input.role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        const w = await this.prisma.withdrawalRequest.findUnique({
            where: { id: input.withdrawalId },
            select: { id: true, status: true, userId: true, amount: true, currency: true },
        });
        if (!w)
            throw new common_1.NotFoundException('Withdrawal not found');
        if (w.status !== client_1.WithdrawalRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Withdrawal is not pending');
        }
        return this.prisma.withdrawalRequest.update({
            where: { id: input.withdrawalId },
            data: {
                status: client_1.WithdrawalRequestStatus.REJECTED,
                adminReviewerId: input.adminId,
                reviewedAt: new Date(),
            },
            select: this.select,
        });
    }
};
exports.WithdrawalsService = WithdrawalsService;
exports.WithdrawalsService = WithdrawalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        kyc_service_1.KycService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map