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
exports.MilestonesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallets/wallet.service");
const domain_events_service_1 = require("../realtime/domain-events.service");
const fundedLike = [
    client_1.MilestoneStatus.FUNDED,
    client_1.MilestoneStatus.IN_PROGRESS,
    client_1.MilestoneStatus.SUBMITTED,
    client_1.MilestoneStatus.APPROVED,
    client_1.MilestoneStatus.RELEASED,
];
let MilestonesService = class MilestonesService {
    constructor(prisma, wallets, events) {
        this.prisma = prisma;
        this.wallets = wallets;
        this.events = events;
        this.select = {
            id: true,
            projectId: true,
            title: true,
            description: true,
            sortOrder: true,
            amount: true,
            currency: true,
            status: true,
            partialPercent: true,
            releasedAmount: true,
            fundedAt: true,
            submittedAt: true,
            approvedAt: true,
            releasedAt: true,
            createdAt: true,
            updatedAt: true,
        };
    }
    async listByProject(input) {
        await this.assertParticipant(input.projectId, input.requesterId, input.role);
        return this.prisma.projectMilestone.findMany({
            where: { projectId: input.projectId },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            select: this.select,
        });
    }
    async create(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can create milestones');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, status: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can add milestones');
        }
        const amountDec = new client_1.Prisma.Decimal(String(input.amount));
        const row = await this.prisma.projectMilestone.create({
            data: {
                projectId: input.projectId,
                title: input.title,
                description: input.description,
                amount: amountDec,
                currency: input.currency,
                sortOrder: input.sortOrder,
                status: client_1.MilestoneStatus.PENDING,
            },
            select: this.select,
        });
        this.emitMilestone(row);
        return row;
    }
    async update(input) {
        if (input.role !== client_1.UserRole.CLIENT)
            throw new common_1.ForbiddenException('Only clients can edit milestones');
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertOwner(m.projectId, input.requesterId);
        if (m.status !== client_1.MilestoneStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending milestones can be edited');
        }
        const row = await this.prisma.projectMilestone.update({
            where: { id: input.milestoneId },
            data: {
                title: input.title,
                description: input.description,
                amount: input.amount !== undefined ? new client_1.Prisma.Decimal(String(input.amount)) : undefined,
                currency: input.currency,
            },
            select: this.select,
        });
        this.emitMilestone(row);
        return row;
    }
    async remove(input) {
        if (input.role !== client_1.UserRole.CLIENT)
            throw new common_1.ForbiddenException('Only clients can delete milestones');
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertOwner(m.projectId, input.requesterId);
        if (m.status !== client_1.MilestoneStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending milestones can be deleted');
        }
        await this.prisma.projectMilestone.delete({ where: { id: input.milestoneId } });
        return { ok: true };
    }
    async fund(input) {
        if (input.role !== client_1.UserRole.CLIENT)
            throw new common_1.ForbiddenException('Only clients can fund milestones');
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertOwner(m.projectId, input.requesterId);
        if (m.status !== client_1.MilestoneStatus.PENDING) {
            throw new common_1.BadRequestException('Milestone is not pending');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: m.projectId },
            select: { clientId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const payment = await this.prisma.payment.findUnique({
            where: { projectId: m.projectId },
            select: { amount: true, status: true, currency: true },
        });
        if (!payment || payment.status !== client_1.PaymentStatus.IN_ESCROW) {
            throw new common_1.BadRequestException('Project must have an active escrow payment before funding milestones');
        }
        const payCap = new client_1.Prisma.Decimal(String(payment.amount));
        const allocated = await this.sumAllocated(m.projectId);
        const next = allocated.add(m.amount);
        if (next.gt(payCap)) {
            throw new common_1.BadRequestException('Total funded milestones would exceed escrow payment amount');
        }
        const funded = await this.prisma.$transaction(async (tx) => {
            const row = await tx.projectMilestone.update({
                where: { id: input.milestoneId },
                data: { status: client_1.MilestoneStatus.FUNDED, fundedAt: new Date() },
                select: this.select,
            });
            await this.wallets.recordMilestoneFundLedgerTx(tx, {
                clientUserId: project.clientId,
                projectId: m.projectId,
                milestoneId: m.id,
                amount: m.amount,
                currency: m.currency,
                actorUserId: input.requesterId,
            });
            return row;
        });
        this.emitMilestone(funded);
        return funded;
    }
    async startProgress(input) {
        if (input.role !== client_1.UserRole.PROVIDER)
            throw new common_1.ForbiddenException('Only providers can start milestone work');
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertSelectedProvider(m.projectId, input.requesterId);
        if (m.status !== client_1.MilestoneStatus.FUNDED) {
            throw new common_1.BadRequestException('Milestone must be funded before work starts');
        }
        const row = await this.prisma.projectMilestone.update({
            where: { id: input.milestoneId },
            data: { status: client_1.MilestoneStatus.IN_PROGRESS },
            select: this.select,
        });
        this.emitMilestone(row);
        return row;
    }
    async submit(input) {
        if (input.role !== client_1.UserRole.PROVIDER)
            throw new common_1.ForbiddenException('Only providers can submit milestones');
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertSelectedProvider(m.projectId, input.requesterId);
        if (m.status !== client_1.MilestoneStatus.FUNDED && m.status !== client_1.MilestoneStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Milestone cannot be submitted from this state');
        }
        const row = await this.prisma.projectMilestone.update({
            where: { id: input.milestoneId },
            data: { status: client_1.MilestoneStatus.SUBMITTED, submittedAt: new Date() },
            select: this.select,
        });
        this.emitMilestone(row);
        return row;
    }
    async approve(input) {
        if (input.role !== client_1.UserRole.CLIENT)
            throw new common_1.ForbiddenException('Only clients can approve milestones');
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertOwner(m.projectId, input.requesterId);
        if (m.status !== client_1.MilestoneStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Milestone must be submitted before approval');
        }
        const partial = input.partialPercent ?? 100;
        if (partial < 1 || partial > 100)
            throw new common_1.BadRequestException('partialPercent must be 1–100');
        const releasedAmount = m.amount.mul(new client_1.Prisma.Decimal(partial)).div(100);
        const row = await this.prisma.projectMilestone.update({
            where: { id: input.milestoneId },
            data: {
                status: client_1.MilestoneStatus.APPROVED,
                approvedAt: new Date(),
                partialPercent: partial,
                releasedAmount,
            },
            select: this.select,
        });
        this.emitMilestone(row);
        return row;
    }
    async release(input) {
        if (input.role !== client_1.UserRole.CLIENT)
            throw new common_1.ForbiddenException('Only clients can release milestone funds');
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertOwner(m.projectId, input.requesterId);
        if (m.status !== client_1.MilestoneStatus.APPROVED) {
            throw new common_1.BadRequestException('Milestone must be approved before release');
        }
        const gross = m.releasedAmount ?? m.amount;
        const project = await this.prisma.project.findUnique({
            where: { id: m.projectId },
            select: { clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const providerId = project.selectedProviderId;
        if (!providerId)
            throw new common_1.BadRequestException('Project has no selected provider');
        const released = await this.prisma.$transaction(async (tx) => {
            const row = await tx.projectMilestone.update({
                where: { id: input.milestoneId },
                data: { status: client_1.MilestoneStatus.RELEASED, releasedAt: new Date() },
                select: this.select,
            });
            await this.wallets.recordMilestoneReleaseTx(tx, {
                clientUserId: project.clientId,
                providerUserId: providerId,
                projectId: m.projectId,
                milestoneId: m.id,
                grossAmount: gross,
                currency: m.currency,
                actorUserId: input.requesterId,
            });
            return row;
        });
        this.emitMilestone(released);
        return released;
    }
    async reject(input) {
        if (input.role !== client_1.UserRole.CLIENT)
            throw new common_1.ForbiddenException('Only clients can reject milestones');
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertOwner(m.projectId, input.requesterId);
        if (m.status === client_1.MilestoneStatus.SUBMITTED) {
            const row = await this.prisma.projectMilestone.update({
                where: { id: input.milestoneId },
                data: { status: client_1.MilestoneStatus.IN_PROGRESS, submittedAt: null },
                select: this.select,
            });
            this.emitMilestone(row);
            return row;
        }
        if (m.status === client_1.MilestoneStatus.FUNDED) {
            const row = await this.prisma.projectMilestone.update({
                where: { id: input.milestoneId },
                data: {
                    status: client_1.MilestoneStatus.PENDING,
                    fundedAt: null,
                    partialPercent: null,
                    releasedAmount: null,
                },
                select: this.select,
            });
            this.emitMilestone(row);
            return row;
        }
        throw new common_1.BadRequestException('Milestone cannot be rejected from this state');
    }
    async listComments(input) {
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertParticipant(m.projectId, input.requesterId, input.role);
        return this.prisma.milestoneComment.findMany({
            where: { milestoneId: input.milestoneId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                body: true,
                createdAt: true,
                author: { select: { id: true, email: true, role: true } },
            },
        });
    }
    async addComment(input) {
        const m = await this.getMilestoneOrThrow(input.milestoneId);
        await this.assertParticipant(m.projectId, input.requesterId, input.role);
        return this.prisma.milestoneComment.create({
            data: {
                milestoneId: input.milestoneId,
                authorId: input.requesterId,
                body: input.body,
            },
            select: {
                id: true,
                body: true,
                createdAt: true,
                author: { select: { id: true, email: true, role: true } },
            },
        });
    }
    serializeMilestone(row) {
        return {
            ...row,
            amount: row.amount.toString(),
            releasedAmount: row.releasedAmount?.toString() ?? null,
        };
    }
    emitMilestone(row) {
        this.events.milestoneUpdated({
            projectId: row.projectId,
            milestone: this.serializeMilestone(row),
        });
    }
    async sumAllocated(projectId) {
        const agg = await this.prisma.projectMilestone.aggregate({
            where: { projectId, status: { in: fundedLike } },
            _sum: { amount: true },
        });
        return agg._sum.amount ?? new client_1.Prisma.Decimal(0);
    }
    async getMilestoneOrThrow(id) {
        const m = await this.prisma.projectMilestone.findUnique({
            where: { id },
            select: this.select,
        });
        if (!m)
            throw new common_1.NotFoundException('Milestone not found');
        return m;
    }
    async assertParticipant(projectId, userId, role) {
        const p = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true, selectedProviderId: true },
        });
        if (!p)
            throw new common_1.NotFoundException('Project not found');
        if (role === client_1.UserRole.ADMIN)
            return;
        if (p.clientId === userId || p.selectedProviderId === userId)
            return;
        throw new common_1.ForbiddenException('Not a project participant');
    }
    async assertOwner(projectId, userId) {
        const p = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true },
        });
        if (!p)
            throw new common_1.NotFoundException('Project not found');
        if (p.clientId !== userId)
            throw new common_1.ForbiddenException('Only project owner can perform this action');
    }
    async assertSelectedProvider(projectId, userId) {
        const p = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { selectedProviderId: true },
        });
        if (!p?.selectedProviderId || p.selectedProviderId !== userId) {
            throw new common_1.ForbiddenException('Only the selected provider can perform this action');
        }
    }
};
exports.MilestonesService = MilestonesService;
exports.MilestonesService = MilestonesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        domain_events_service_1.DomainEventsService])
], MilestonesService);
//# sourceMappingURL=milestones.service.js.map