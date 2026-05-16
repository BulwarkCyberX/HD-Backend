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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const wallet_service_1 = require("../wallets/wallet.service");
const platform_fee_service_1 = require("../wallets/platform-fee.service");
let PaymentsService = class PaymentsService {
    constructor(prisma, notifications, wallets, platformFees) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.wallets = wallets;
        this.platformFees = platformFees;
        this.paymentSelect = {
            id: true,
            projectId: true,
            payerId: true,
            payeeId: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
        };
    }
    async deposit(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can deposit payment');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can deposit payment');
        }
        if (!project.selectedProviderId) {
            throw new common_1.BadRequestException('Project must have selected provider before deposit');
        }
        const existing = await this.prisma.payment.findUnique({
            where: { projectId: input.projectId },
            select: { id: true, status: true },
        });
        if (existing) {
            throw new common_1.BadRequestException('Payment already exists for this project');
        }
        const amountDec = new client_1.Prisma.Decimal(String(input.amount));
        return await this.prisma.$transaction(async (tx) => {
            const created = await tx.payment.create({
                data: {
                    projectId: input.projectId,
                    payerId: input.requesterId,
                    payeeId: project.selectedProviderId,
                    amount: input.amount,
                    currency: input.currency,
                    status: client_1.PaymentStatus.IN_ESCROW,
                },
                select: { id: true },
            });
            await this.wallets.recordProjectEscrowDepositTx(tx, {
                clientUserId: input.requesterId,
                projectId: input.projectId,
                amount: amountDec,
                currency: input.currency,
                actorUserId: input.requesterId,
            });
            return tx.payment.findUniqueOrThrow({
                where: { id: created.id },
                select: this.paymentSelect,
            });
        });
    }
    async release(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can release payment');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, status: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can release payment');
        }
        if (project.status !== client_1.ProjectStatus.COMPLETED) {
            throw new common_1.BadRequestException('Project must be completed before release');
        }
        const payment = await this.prisma.payment.findUnique({
            where: { projectId: input.projectId },
            select: { id: true, status: true, amount: true, currency: true, payeeId: true, projectId: true },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found for project');
        if (payment.status !== client_1.PaymentStatus.IN_ESCROW) {
            throw new common_1.BadRequestException('Only escrowed payments can be released');
        }
        const { clientFeeBps, providerFeeBps } = await this.platformFees.getActiveFeeBps();
        const payAmt = new client_1.Prisma.Decimal(String(payment.amount));
        const clientWallet = await this.prisma.userWallet.findUnique({
            where: { userId: project.clientId },
            select: { escrowBalance: true },
        });
        const escrowBal = clientWallet?.escrowBalance ?? new client_1.Prisma.Decimal(0);
        const gross = payAmt.lt(escrowBal) ? payAmt : escrowBal;
        return await this.prisma.$transaction(async (tx) => {
            const released = await tx.payment.update({
                where: { projectId: input.projectId },
                data: { status: client_1.PaymentStatus.RELEASED },
                select: this.paymentSelect,
            });
            if (gross.gt(0)) {
                const clientFee = gross.mul(clientFeeBps).div(10000);
                const providerFee = gross.mul(providerFeeBps).div(10000);
                const platformTotal = clientFee.add(providerFee);
                const netToProvider = gross.sub(clientFee).sub(providerFee);
                await this.wallets.recordEscrowReleaseAndFeesTx(tx, {
                    clientUserId: project.clientId,
                    providerUserId: payment.payeeId,
                    projectId: payment.projectId,
                    paymentId: payment.id,
                    grossAmount: gross,
                    currency: payment.currency,
                    actorUserId: input.requesterId,
                    clientFee,
                    providerFee,
                    platformTotal,
                    netToProvider,
                    clientFeeBps,
                    providerFeeBps,
                });
            }
            await this.notifications.create({
                userId: released.payeeId,
                type: client_1.NotificationType.PAYMENT_RELEASED,
                message: `Escrow payment released for project ${released.projectId}`,
            });
            return released;
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        wallet_service_1.WalletService,
        platform_fee_service_1.PlatformFeeService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map