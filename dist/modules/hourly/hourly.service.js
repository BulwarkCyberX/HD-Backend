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
exports.HourlyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallets/wallet.service");
const entrySelect = {
    id: true,
    engagementId: true,
    providerId: true,
    workDate: true,
    hours: true,
    description: true,
    status: true,
    submittedAt: true,
    approvedAt: true,
    rejectedReason: true,
    billedAt: true,
    billedAmount: true,
    createdAt: true,
    updatedAt: true,
};
const engagementSelect = {
    id: true,
    projectId: true,
    hourlyRate: true,
    currency: true,
    weeklyCapHours: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    timeEntries: { select: entrySelect, orderBy: { workDate: 'desc' } },
};
let HourlyService = class HourlyService {
    constructor(prisma, wallets) {
        this.prisma = prisma;
        this.wallets = wallets;
    }
    async ensureEngagementForProject(input) {
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, budgetType: true },
        });
        if (!project || project.budgetType !== client_1.BudgetType.HOURLY)
            return null;
        const existing = await this.prisma.hourlyEngagement.findUnique({
            where: { projectId: input.projectId },
            select: { id: true },
        });
        if (existing)
            return existing;
        return this.prisma.hourlyEngagement.create({
            data: {
                projectId: input.projectId,
                hourlyRate: new client_1.Prisma.Decimal(String(input.hourlyRate)),
                currency: input.currency ?? 'INR',
                weeklyCapHours: input.weeklyCapHours ?? 40,
            },
            select: engagementSelect,
        });
    }
    async getByProject(input) {
        await this.assertParticipant(input.projectId, input.requesterId, input.role);
        const row = await this.prisma.hourlyEngagement.findUnique({
            where: { projectId: input.projectId },
            select: engagementSelect,
        });
        if (!row)
            throw new common_1.NotFoundException('Hourly engagement not configured for this project');
        return row;
    }
    async upsertEngagement(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can configure hourly engagement');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { clientId: true, budgetType: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can configure hourly engagement');
        }
        if (project.budgetType !== client_1.BudgetType.HOURLY) {
            throw new common_1.BadRequestException('Project is not hourly');
        }
        if (!project.selectedProviderId) {
            throw new common_1.BadRequestException('Assign a provider before configuring hourly billing');
        }
        return this.prisma.hourlyEngagement.upsert({
            where: { projectId: input.projectId },
            create: {
                projectId: input.projectId,
                hourlyRate: new client_1.Prisma.Decimal(String(input.hourlyRate)),
                currency: input.currency ?? 'INR',
                weeklyCapHours: input.weeklyCapHours ?? 40,
            },
            update: {
                hourlyRate: new client_1.Prisma.Decimal(String(input.hourlyRate)),
                ...(input.weeklyCapHours !== undefined ? { weeklyCapHours: input.weeklyCapHours } : {}),
                ...(input.currency !== undefined ? { currency: input.currency } : {}),
            },
            select: engagementSelect,
        });
    }
    async createTimeEntry(input) {
        if (input.role !== client_1.UserRole.PROVIDER) {
            throw new common_1.ForbiddenException('Only providers can log time');
        }
        const engagement = await this.getEngagementOrThrow(input.engagementId);
        await this.assertSelectedProvider(engagement.projectId, input.requesterId);
        if (engagement.status !== client_1.HourlyEngagementStatus.ACTIVE) {
            throw new common_1.BadRequestException('Hourly engagement is not active');
        }
        return this.prisma.timeEntry.create({
            data: {
                engagementId: input.engagementId,
                providerId: input.requesterId,
                workDate: new Date(input.workDate),
                hours: new client_1.Prisma.Decimal(String(input.hours)),
                description: input.description,
                status: client_1.TimeEntryStatus.DRAFT,
            },
            select: entrySelect,
        });
    }
    async updateTimeEntry(input) {
        if (input.role !== client_1.UserRole.PROVIDER) {
            throw new common_1.ForbiddenException('Only providers can edit time entries');
        }
        const entry = await this.getEntryOrThrow(input.entryId);
        if (entry.providerId !== input.requesterId) {
            throw new common_1.ForbiddenException('Not your time entry');
        }
        if (entry.status !== client_1.TimeEntryStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft entries can be edited');
        }
        return this.prisma.timeEntry.update({
            where: { id: input.entryId },
            data: {
                workDate: input.workDate ? new Date(input.workDate) : undefined,
                hours: input.hours !== undefined ? new client_1.Prisma.Decimal(String(input.hours)) : undefined,
                description: input.description,
            },
            select: entrySelect,
        });
    }
    async submitTimeEntry(input) {
        if (input.role !== client_1.UserRole.PROVIDER) {
            throw new common_1.ForbiddenException('Only providers can submit time entries');
        }
        const entry = await this.getEntryOrThrow(input.entryId);
        if (entry.providerId !== input.requesterId) {
            throw new common_1.ForbiddenException('Not your time entry');
        }
        if (entry.status !== client_1.TimeEntryStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft entries can be submitted');
        }
        const engagement = await this.getEngagementOrThrow(entry.engagementId);
        await this.assertWeeklyCap(engagement.id, engagement.weeklyCapHours, entry.workDate, entry.hours);
        return this.prisma.timeEntry.update({
            where: { id: input.entryId },
            data: { status: client_1.TimeEntryStatus.SUBMITTED, submittedAt: new Date(), rejectedReason: null },
            select: entrySelect,
        });
    }
    async approveTimeEntry(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can approve time entries');
        }
        const entry = await this.getEntryOrThrow(input.entryId);
        const engagement = await this.getEngagementOrThrow(entry.engagementId);
        await this.assertOwner(engagement.projectId, input.requesterId);
        if (entry.status !== client_1.TimeEntryStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Entry must be submitted before approval');
        }
        return this.prisma.timeEntry.update({
            where: { id: input.entryId },
            data: {
                status: client_1.TimeEntryStatus.APPROVED,
                approvedAt: new Date(),
                approvedById: input.requesterId,
                rejectedReason: null,
            },
            select: entrySelect,
        });
    }
    async rejectTimeEntry(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can reject time entries');
        }
        const entry = await this.getEntryOrThrow(input.entryId);
        const engagement = await this.getEngagementOrThrow(entry.engagementId);
        await this.assertOwner(engagement.projectId, input.requesterId);
        if (entry.status !== client_1.TimeEntryStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted entries can be rejected');
        }
        return this.prisma.timeEntry.update({
            where: { id: input.entryId },
            data: {
                status: client_1.TimeEntryStatus.DRAFT,
                rejectedReason: input.reason ?? 'Rejected by client',
                submittedAt: null,
                approvedAt: null,
                approvedById: null,
            },
            select: entrySelect,
        });
    }
    async setEngagementStatus(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can change engagement status');
        }
        await this.assertOwner(input.projectId, input.requesterId);
        const row = await this.prisma.hourlyEngagement.findUnique({
            where: { projectId: input.projectId },
        });
        if (!row)
            throw new common_1.NotFoundException('Hourly engagement not found');
        return this.prisma.hourlyEngagement.update({
            where: { projectId: input.projectId },
            data: { status: input.status },
            select: engagementSelect,
        });
    }
    async getProjectSummary(input) {
        await this.assertParticipant(input.projectId, input.requesterId, input.role);
        const engagement = await this.prisma.hourlyEngagement.findUnique({
            where: { projectId: input.projectId },
            include: { timeEntries: true },
        });
        if (!engagement)
            throw new common_1.NotFoundException('Hourly engagement not configured');
        const rate = engagement.hourlyRate;
        let draftHours = new client_1.Prisma.Decimal(0);
        let submittedHours = new client_1.Prisma.Decimal(0);
        let approvedHours = new client_1.Prisma.Decimal(0);
        let billedHours = new client_1.Prisma.Decimal(0);
        let billedAmount = new client_1.Prisma.Decimal(0);
        for (const e of engagement.timeEntries) {
            if (e.status === client_1.TimeEntryStatus.DRAFT)
                draftHours = draftHours.add(e.hours);
            if (e.status === client_1.TimeEntryStatus.SUBMITTED)
                submittedHours = submittedHours.add(e.hours);
            if (e.status === client_1.TimeEntryStatus.APPROVED)
                approvedHours = approvedHours.add(e.hours);
            if (e.status === client_1.TimeEntryStatus.BILLED) {
                billedHours = billedHours.add(e.hours);
                billedAmount = billedAmount.add(e.billedAmount ?? rate.mul(e.hours));
            }
        }
        const pendingHours = submittedHours.add(approvedHours);
        const pendingAmount = pendingHours.mul(rate);
        return {
            projectId: input.projectId,
            hourlyRate: rate,
            currency: engagement.currency,
            engagementStatus: engagement.status,
            weeklyCapHours: engagement.weeklyCapHours,
            draftHours: draftHours.toNumber(),
            submittedHours: submittedHours.toNumber(),
            approvedHours: approvedHours.toNumber(),
            billedHours: billedHours.toNumber(),
            billedAmount: billedAmount.toNumber(),
            pendingAmount: pendingAmount.toNumber(),
            entryCount: engagement.timeEntries.length,
        };
    }
    async billTimeEntry(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can bill time entries');
        }
        const entry = await this.getEntryOrThrow(input.entryId);
        const engagement = await this.getEngagementOrThrow(entry.engagementId);
        await this.assertOwner(engagement.projectId, input.requesterId);
        if (entry.status !== client_1.TimeEntryStatus.APPROVED) {
            throw new common_1.BadRequestException('Entry must be approved before billing');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: engagement.projectId },
            select: {
                clientId: true,
                selectedProviderId: true,
                payment: { select: { status: true, amount: true, currency: true } },
            },
        });
        if (!project?.selectedProviderId) {
            throw new common_1.BadRequestException('Project has no selected provider');
        }
        if (project.payment?.status !== client_1.PaymentStatus.IN_ESCROW) {
            throw new common_1.BadRequestException('Project escrow must be funded before billing hours');
        }
        const gross = engagement.hourlyRate.mul(entry.hours);
        const alreadyBilled = await this.sumBilledAmount(engagement.id);
        const escrowAmount = new client_1.Prisma.Decimal(String(project.payment.amount));
        if (alreadyBilled.add(gross).gt(escrowAmount)) {
            throw new common_1.BadRequestException('Billing would exceed project escrow balance');
        }
        return this.prisma.$transaction(async (tx) => {
            const row = await tx.timeEntry.update({
                where: { id: input.entryId },
                data: {
                    status: client_1.TimeEntryStatus.BILLED,
                    billedAt: new Date(),
                    billedAmount: gross,
                },
                select: entrySelect,
            });
            await this.wallets.recordMilestoneReleaseTx(tx, {
                clientUserId: project.clientId,
                providerUserId: project.selectedProviderId,
                projectId: engagement.projectId,
                milestoneId: row.id,
                grossAmount: gross,
                currency: engagement.currency,
                actorUserId: input.requesterId,
            });
            return row;
        });
    }
    async sumBilledAmount(engagementId) {
        const rows = await this.prisma.timeEntry.findMany({
            where: { engagementId, status: client_1.TimeEntryStatus.BILLED },
            select: { billedAmount: true },
        });
        return rows.reduce((acc, r) => acc.add(r.billedAmount ?? new client_1.Prisma.Decimal(0)), new client_1.Prisma.Decimal(0));
    }
    async assertWeeklyCap(engagementId, weeklyCapHours, workDate, newHours) {
        const start = this.weekStart(workDate);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 7);
        const entries = await this.prisma.timeEntry.findMany({
            where: {
                engagementId,
                workDate: { gte: start, lt: end },
                status: { in: [client_1.TimeEntryStatus.SUBMITTED, client_1.TimeEntryStatus.APPROVED, client_1.TimeEntryStatus.BILLED] },
            },
            select: { hours: true },
        });
        const total = entries.reduce((acc, e) => acc.add(e.hours), new client_1.Prisma.Decimal(0)).add(newHours);
        if (total.toNumber() > weeklyCapHours) {
            throw new common_1.BadRequestException(`Weekly cap of ${weeklyCapHours}h would be exceeded`);
        }
    }
    weekStart(d) {
        const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const day = date.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        date.setUTCDate(date.getUTCDate() + diff);
        return date;
    }
    async getEngagementOrThrow(engagementId) {
        const row = await this.prisma.hourlyEngagement.findUnique({
            where: { id: engagementId },
            select: { ...engagementSelect, timeEntries: false },
        });
        if (!row)
            throw new common_1.NotFoundException('Hourly engagement not found');
        return row;
    }
    async getEntryOrThrow(entryId) {
        const row = await this.prisma.timeEntry.findUnique({
            where: { id: entryId },
            select: { ...entrySelect, engagementId: true },
        });
        if (!row)
            throw new common_1.NotFoundException('Time entry not found');
        return row;
    }
    async assertParticipant(projectId, userId, role) {
        if (role === client_1.UserRole.ADMIN)
            return;
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== userId && project.selectedProviderId !== userId) {
            throw new common_1.ForbiddenException('Not a project participant');
        }
    }
    async assertOwner(projectId, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== userId)
            throw new common_1.ForbiddenException('Only project owner');
    }
    async assertSelectedProvider(projectId, providerId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { selectedProviderId: true },
        });
        if (!project?.selectedProviderId || project.selectedProviderId !== providerId) {
            throw new common_1.ForbiddenException('Not the selected provider on this project');
        }
    }
};
exports.HourlyService = HourlyService;
exports.HourlyService = HourlyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], HourlyService);
//# sourceMappingURL=hourly.service.js.map