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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const platform_fee_service_1 = require("./platform-fee.service");
let WalletService = class WalletService {
    constructor(prisma, config, platformFees) {
        this.prisma = prisma;
        this.config = config;
        this.platformFees = platformFees;
    }
    platformWalletId() {
        return this.config.get('PLATFORM_WALLET_ID') ?? 'platform_wallet_main';
    }
    async ensureUserWallet(userId, currency) {
        const existing = await this.prisma.userWallet.findUnique({ where: { userId } });
        if (existing)
            return existing;
        return this.prisma.userWallet.create({
            data: { userId, currency },
        });
    }
    async ensurePlatformWallet() {
        const id = this.platformWalletId();
        const row = await this.prisma.platformWallet.findUnique({ where: { id } });
        if (row)
            return row;
        return this.prisma.platformWallet.create({ data: { id } });
    }
    async getWalletSummary(userId) {
        const w = await this.prisma.userWallet.findUnique({
            where: { userId },
            select: {
                availableBalance: true,
                pendingBalance: true,
                escrowBalance: true,
                lifetimeEarnings: true,
                totalSpent: true,
                currency: true,
                updatedAt: true,
            },
        });
        if (!w) {
            return {
                availableBalance: '0',
                pendingBalance: '0',
                escrowBalance: '0',
                lifetimeEarnings: '0',
                totalSpent: '0',
                currency: client_1.PaymentCurrency.INR,
                updatedAt: null,
            };
        }
        return {
            availableBalance: w.availableBalance.toString(),
            pendingBalance: w.pendingBalance.toString(),
            escrowBalance: w.escrowBalance.toString(),
            lifetimeEarnings: w.lifetimeEarnings.toString(),
            totalSpent: w.totalSpent.toString(),
            currency: w.currency,
            updatedAt: w.updatedAt,
        };
    }
    async recordProjectEscrowDeposit(input) {
        return this.prisma.$transaction(async (tx) => this.recordProjectEscrowDepositTx(tx, input));
    }
    async recordProjectEscrowDepositTx(tx, input) {
        const { clientUserId, projectId, amount, currency, actorUserId } = input;
        await this.ensureUserWalletTx(tx, clientUserId, currency);
        const clientWallet = await tx.userWallet.update({
            where: { userId: clientUserId },
            data: {
                escrowBalance: { increment: amount },
                totalSpent: { increment: amount },
            },
        });
        await tx.walletLedgerEntry.create({
            data: {
                type: client_1.LedgerEntryType.ESCROW_HOLD,
                amount,
                currency,
                status: client_1.LedgerEntryStatus.POSTED,
                referenceId: projectId,
                metadata: { projectId, note: 'ledger_only_direct_escrow' },
                userWalletId: clientWallet.id,
                actorUserId,
            },
        });
        return clientWallet;
    }
    async recordEscrowReleaseAndFees(input) {
        const { clientUserId, providerUserId, projectId, paymentId, grossAmount, currency, actorUserId } = input;
        const { clientFeeBps, providerFeeBps } = await this.platformFees.getActiveFeeBps();
        const clientFee = grossAmount.mul(clientFeeBps).div(10000);
        const providerFee = grossAmount.mul(providerFeeBps).div(10000);
        const platformTotal = clientFee.add(providerFee);
        const netToProvider = grossAmount.sub(clientFee).sub(providerFee);
        return this.prisma.$transaction(async (tx) => this.recordEscrowReleaseAndFeesTx(tx, {
            clientUserId,
            providerUserId,
            projectId,
            paymentId,
            grossAmount,
            currency,
            actorUserId,
            clientFee,
            providerFee,
            platformTotal,
            netToProvider,
            clientFeeBps,
            providerFeeBps,
        }));
    }
    async recordEscrowReleaseAndFeesTx(tx, input) {
        const { clientUserId, providerUserId, projectId, paymentId, grossAmount, currency, actorUserId, clientFee, providerFee, platformTotal, netToProvider, clientFeeBps, providerFeeBps, } = input;
        const platform = await this.ensurePlatformWalletTx(tx);
        await this.ensureUserWalletTx(tx, clientUserId, currency);
        await this.ensureUserWalletTx(tx, providerUserId, currency);
        const clientWallet = await tx.userWallet.findUniqueOrThrow({ where: { userId: clientUserId } });
        const providerWallet = await tx.userWallet.findUniqueOrThrow({ where: { userId: providerUserId } });
        if (clientWallet.escrowBalance.lt(grossAmount)) {
            throw new common_1.BadRequestException('Insufficient escrow balance for release');
        }
        await tx.userWallet.update({
            where: { id: clientWallet.id },
            data: { escrowBalance: { decrement: grossAmount } },
        });
        await tx.walletLedgerEntry.create({
            data: {
                type: client_1.LedgerEntryType.ESCROW_RELEASE,
                amount: grossAmount,
                currency,
                status: client_1.LedgerEntryStatus.POSTED,
                referenceId: paymentId,
                metadata: { projectId, leg: 'client_escrow_release' },
                userWalletId: clientWallet.id,
                actorUserId,
            },
        });
        await tx.userWallet.update({
            where: { id: providerWallet.id },
            data: {
                availableBalance: { increment: netToProvider },
                lifetimeEarnings: { increment: netToProvider },
            },
        });
        await tx.walletLedgerEntry.create({
            data: {
                type: client_1.LedgerEntryType.ESCROW_RELEASE,
                amount: netToProvider,
                currency,
                status: client_1.LedgerEntryStatus.POSTED,
                referenceId: paymentId,
                metadata: { projectId, leg: 'provider_payout_net' },
                userWalletId: providerWallet.id,
                actorUserId,
            },
        });
        if (platformTotal.gt(0)) {
            await tx.platformWallet.update({
                where: { id: platform.id },
                data: {
                    availableBalance: { increment: platformTotal },
                    lifetimeEarnings: { increment: platformTotal },
                },
            });
            await tx.walletLedgerEntry.create({
                data: {
                    type: client_1.LedgerEntryType.PLATFORM_FEE,
                    amount: platformTotal,
                    currency,
                    status: client_1.LedgerEntryStatus.POSTED,
                    referenceId: paymentId,
                    metadata: {
                        projectId,
                        clientFeeBps,
                        providerFeeBps,
                        clientFee: clientFee.toString(),
                        providerFee: providerFee.toString(),
                    },
                    platformWalletId: platform.id,
                    actorUserId,
                },
            });
        }
        return { netToProvider, platformTotal, clientFee, providerFee };
    }
    async recordMilestoneFundLedgerTx(tx, input) {
        const { clientUserId, projectId, milestoneId, amount, currency, actorUserId } = input;
        await this.ensureUserWalletTx(tx, clientUserId, currency);
        const clientWallet = await tx.userWallet.findUniqueOrThrow({ where: { userId: clientUserId } });
        await tx.walletLedgerEntry.create({
            data: {
                type: client_1.LedgerEntryType.MILESTONE_FUND,
                amount,
                currency,
                status: client_1.LedgerEntryStatus.POSTED,
                referenceId: milestoneId,
                metadata: { projectId, milestoneId, informationalAllocationFromProjectEscrow: true },
                userWalletId: clientWallet.id,
                actorUserId,
            },
        });
    }
    async recordMilestoneReleaseTx(tx, input) {
        const { clientFeeBps, providerFeeBps } = await this.platformFees.getActiveFeeBps();
        const grossAmount = input.grossAmount;
        const clientFee = grossAmount.mul(clientFeeBps).div(10000);
        const providerFee = grossAmount.mul(providerFeeBps).div(10000);
        const platformTotal = clientFee.add(providerFee);
        const netToProvider = grossAmount.sub(clientFee).sub(providerFee);
        return this.recordEscrowReleaseAndFeesTx(tx, {
            clientUserId: input.clientUserId,
            providerUserId: input.providerUserId,
            projectId: input.projectId,
            paymentId: `milestone:${input.milestoneId}`,
            grossAmount,
            currency: input.currency,
            actorUserId: input.actorUserId,
            clientFee,
            providerFee,
            platformTotal,
            netToProvider,
            clientFeeBps,
            providerFeeBps,
        });
    }
    async recordMilestoneRejectRefundTx(tx, input) {
        const { clientUserId, amount, currency, actorUserId, milestoneId, projectId } = input;
        await this.ensureUserWalletTx(tx, clientUserId, currency);
        const clientWallet = await tx.userWallet.findUniqueOrThrow({ where: { userId: clientUserId } });
        await tx.userWallet.update({
            where: { id: clientWallet.id },
            data: { escrowBalance: { increment: amount } },
        });
        await tx.walletLedgerEntry.create({
            data: {
                type: client_1.LedgerEntryType.MILESTONE_REJECT_REFUND,
                amount,
                currency,
                status: client_1.LedgerEntryStatus.POSTED,
                referenceId: milestoneId,
                metadata: { projectId, milestoneId, leg: 'return_allocation_to_escrow' },
                userWalletId: clientWallet.id,
                actorUserId,
            },
        });
    }
    async recordWithdrawalDebit(input) {
        return this.prisma.$transaction(async (tx) => this.recordWithdrawalDebitTx(tx, input));
    }
    async recordWithdrawalDebitTx(tx, input) {
        const { userId, withdrawalId, amount, currency, actorUserId } = input;
        await this.ensureUserWalletTx(tx, userId, currency);
        const uw = await tx.userWallet.findUniqueOrThrow({ where: { userId } });
        if (uw.availableBalance.lt(amount)) {
            throw new common_1.BadRequestException('Insufficient available balance');
        }
        await tx.userWallet.update({
            where: { id: uw.id },
            data: { availableBalance: { decrement: amount } },
        });
        await tx.walletLedgerEntry.create({
            data: {
                type: client_1.LedgerEntryType.WITHDRAWAL,
                amount,
                currency,
                status: client_1.LedgerEntryStatus.POSTED,
                referenceId: withdrawalId,
                userWalletId: uw.id,
                actorUserId,
            },
        });
    }
    async refundWithdrawalHold(input) {
        const { userId, withdrawalId, amount, currency, actorUserId } = input;
        return this.prisma.$transaction(async (tx) => {
            const uw = await tx.userWallet.findUnique({ where: { userId } });
            if (!uw)
                return;
            await tx.userWallet.update({
                where: { id: uw.id },
                data: { availableBalance: { increment: amount } },
            });
            await tx.walletLedgerEntry.create({
                data: {
                    type: client_1.LedgerEntryType.REFUND,
                    amount,
                    currency,
                    status: client_1.LedgerEntryStatus.POSTED,
                    referenceId: withdrawalId,
                    metadata: { reason: 'withdrawal_rejected' },
                    userWalletId: uw.id,
                    actorUserId,
                },
            });
        });
    }
    async ensureUserWalletTx(tx, userId, currency) {
        const existing = await tx.userWallet.findUnique({ where: { userId } });
        if (existing)
            return existing;
        return tx.userWallet.create({ data: { userId, currency } });
    }
    async ensurePlatformWalletTx(tx) {
        const id = this.platformWalletId();
        const row = await tx.platformWallet.findUnique({ where: { id } });
        if (row)
            return row;
        return tx.platformWallet.create({ data: { id } });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        platform_fee_service_1.PlatformFeeService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map