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
exports.DisputesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallets/wallet.service");
let DisputesService = class DisputesService {
    constructor(prisma, wallets) {
        this.prisma = prisma;
        this.wallets = wallets;
        this.select = {
            id: true,
            projectId: true,
            openedById: true,
            category: true,
            status: true,
            title: true,
            description: true,
            resolution: true,
            resolvedAt: true,
            createdAt: true,
            updatedAt: true,
        };
    }
    filePublicUrl(fileId) {
        const base = process.env.PUBLIC_API_URL ?? process.env.WEB_ORIGIN?.split(',')[0]?.trim() ?? 'http://localhost:4000';
        return `${base.replace(/\/$/, '')}/files/${fileId}`;
    }
    async create(input) {
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const ok = input.role === client_1.UserRole.ADMIN ||
            project.clientId === input.requesterId ||
            project.selectedProviderId === input.requesterId;
        if (!ok)
            throw new common_1.ForbiddenException('Not a project participant');
        return this.prisma.dispute.create({
            data: {
                projectId: input.projectId,
                openedById: input.requesterId,
                category: input.category,
                title: input.title,
                description: input.description,
                status: client_1.DisputeStatus.OPEN,
            },
            select: this.select,
        });
    }
    async listForProject(input) {
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const ok = input.role === client_1.UserRole.ADMIN ||
            project.clientId === input.requesterId ||
            project.selectedProviderId === input.requesterId;
        if (!ok)
            throw new common_1.ForbiddenException('Not a project participant');
        return this.prisma.dispute.findMany({
            where: { projectId: input.projectId },
            orderBy: { createdAt: 'desc' },
            select: this.select,
        });
    }
    async getById(input) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: input.disputeId },
            select: {
                ...this.select,
                project: {
                    select: {
                        id: true,
                        title: true,
                        clientId: true,
                        selectedProviderId: true,
                        status: true,
                    },
                },
                openedBy: { select: { id: true, email: true, role: true } },
                comments: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        body: true,
                        internal: true,
                        createdAt: true,
                        author: { select: { id: true, email: true, role: true } },
                    },
                },
                evidence: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        note: true,
                        createdAt: true,
                        fileAsset: {
                            select: {
                                id: true,
                                originalName: true,
                                mimeType: true,
                                size: true,
                            },
                        },
                    },
                },
            },
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        await this.assertDisputeAccess(dispute.projectId, input.requesterId, input.role);
        const comments = input.role === client_1.UserRole.ADMIN
            ? dispute.comments
            : dispute.comments.filter((c) => !c.internal);
        const evidence = dispute.evidence.map((e) => ({
            ...e,
            fileAsset: { ...e.fileAsset, url: this.filePublicUrl(e.fileAsset.id) },
        }));
        return { ...dispute, comments, evidence };
    }
    async listAdmin(role) {
        if (role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        return this.prisma.dispute.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            select: {
                ...this.select,
                project: { select: { id: true, title: true } },
            },
        });
    }
    async addComment(input) {
        const d = await this.prisma.dispute.findUnique({
            where: { id: input.disputeId },
            select: { id: true, projectId: true, status: true },
        });
        if (!d)
            throw new common_1.NotFoundException('Dispute not found');
        if (d.status === client_1.DisputeStatus.RESOLVED || d.status === client_1.DisputeStatus.REFUNDED || d.status === client_1.DisputeStatus.REJECTED) {
            throw new common_1.BadRequestException('Dispute is closed');
        }
        await this.assertDisputeAccess(d.projectId, input.requesterId, input.role, input.internal);
        if (input.internal && input.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admins can post internal notes');
        }
        return this.prisma.disputeComment.create({
            data: {
                disputeId: input.disputeId,
                authorId: input.requesterId,
                body: input.body,
                internal: Boolean(input.internal),
            },
            select: {
                id: true,
                body: true,
                internal: true,
                createdAt: true,
                author: { select: { id: true, email: true, role: true } },
            },
        });
    }
    async addEvidence(input) {
        const d = await this.prisma.dispute.findUnique({
            where: { id: input.disputeId },
            select: { id: true, projectId: true, status: true },
        });
        if (!d)
            throw new common_1.NotFoundException('Dispute not found');
        await this.assertDisputeAccess(d.projectId, input.requesterId, input.role);
        if (d.status === client_1.DisputeStatus.RESOLVED || d.status === client_1.DisputeStatus.REFUNDED || d.status === client_1.DisputeStatus.REJECTED) {
            throw new common_1.BadRequestException('Dispute is closed');
        }
        const file = await this.prisma.fileAsset.findUnique({
            where: { id: input.fileAssetId },
            select: { id: true, projectId: true, uploadedById: true },
        });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        if (file.projectId !== d.projectId) {
            throw new common_1.BadRequestException('File must belong to the same project');
        }
        if (input.role !== client_1.UserRole.ADMIN && file.uploadedById !== input.requesterId) {
            throw new common_1.ForbiddenException('You can only attach files you uploaded');
        }
        const existing = await this.prisma.disputeEvidence.findUnique({
            where: { fileAssetId: input.fileAssetId },
        });
        if (existing)
            throw new common_1.BadRequestException('File already attached to a dispute');
        const row = await this.prisma.disputeEvidence.create({
            data: {
                disputeId: input.disputeId,
                fileAssetId: input.fileAssetId,
                note: input.note ?? null,
            },
            select: {
                id: true,
                note: true,
                createdAt: true,
                fileAsset: {
                    select: { id: true, originalName: true, mimeType: true, size: true },
                },
            },
        });
        return {
            ...row,
            fileAsset: { ...row.fileAsset, url: this.filePublicUrl(row.fileAsset.id) },
        };
    }
    async resolve(input) {
        if (input.role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: input.disputeId },
            select: { id: true, projectId: true, status: true },
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        const shouldRefund = input.status === client_1.DisputeStatus.REFUNDED && input.processEscrowRefund !== false;
        if (shouldRefund) {
            await this.refundProjectEscrow({
                projectId: dispute.projectId,
                adminId: input.adminId,
                disputeId: dispute.id,
            });
        }
        return this.prisma.dispute.update({
            where: { id: input.disputeId },
            data: {
                status: input.status,
                resolution: input.resolution ?? null,
                resolvedAt: new Date(),
            },
            select: this.select,
        });
    }
    async markReview(input) {
        if (input.role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        return this.prisma.dispute.update({
            where: { id: input.disputeId },
            data: { status: client_1.DisputeStatus.UNDER_REVIEW },
            select: this.select,
        });
    }
    async refundProjectEscrow(input) {
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { clientId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const payment = await this.prisma.payment.findUnique({
            where: { projectId: input.projectId },
            select: { id: true, amount: true, currency: true, status: true, payerId: true },
        });
        if (!payment) {
            throw new common_1.BadRequestException('No payment record for this project');
        }
        if (payment.status === client_1.PaymentStatus.RELEASED) {
            throw new common_1.BadRequestException('Payment already released — cannot refund escrow');
        }
        if (payment.status === client_1.PaymentStatus.REFUNDED) {
            return;
        }
        if (payment.status !== client_1.PaymentStatus.IN_ESCROW) {
            throw new common_1.BadRequestException('Payment is not in escrow');
        }
        const amount = new client_2.Prisma.Decimal(payment.amount);
        await this.prisma.$transaction(async (tx) => {
            await this.wallets.recordProjectEscrowRefundToClientTx(tx, {
                clientUserId: project.clientId,
                projectId: input.projectId,
                paymentId: payment.id,
                amount,
                currency: payment.currency,
                actorUserId: input.adminId,
                disputeId: input.disputeId,
            });
            await tx.payment.update({
                where: { id: payment.id },
                data: { status: client_1.PaymentStatus.REFUNDED },
            });
        });
    }
    async assertDisputeAccess(projectId, userId, role, internal) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (role === client_1.UserRole.ADMIN)
            return;
        if (project.clientId === userId || project.selectedProviderId === userId)
            return;
        throw new common_1.ForbiddenException('Forbidden');
    }
};
exports.DisputesService = DisputesService;
exports.DisputesService = DisputesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], DisputesService);
//# sourceMappingURL=disputes.service.js.map