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
exports.BountyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let BountyService = class BountyService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.programSelect = {
            id: true,
            clientId: true,
            title: true,
            description: true,
            scope: true,
            rewardTable: true,
            status: true,
            allowedResearcherIds: true,
            createdAt: true,
        };
        this.bugReportSelect = {
            id: true,
            programId: true,
            researcherId: true,
            title: true,
            description: true,
            severity: true,
            status: true,
            createdAt: true,
            researcher: { select: { id: true, email: true } },
            files: {
                select: {
                    id: true,
                    originalName: true,
                    mimeType: true,
                    size: true,
                    createdAt: true,
                },
            },
        };
    }
    async createProgram(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can create bug bounty programs');
        }
        return await this.prisma.bugBountyProgram.create({
            data: {
                clientId: input.clientId,
                title: input.title,
                description: input.description ?? '',
                scope: input.scope,
                rewardTable: input.rewardTable,
                status: input.status ?? client_1.BugBountyProgramStatus.DRAFT,
                allowedResearcherIds: input.allowedResearcherIds ?? [],
            },
            select: this.programSelect,
        });
    }
    async listPrograms(input) {
        if (input.role === client_1.UserRole.ADMIN) {
            return await this.prisma.bugBountyProgram.findMany({
                orderBy: { createdAt: 'desc' },
                select: this.programSelect,
            });
        }
        if (input.role === client_1.UserRole.CLIENT) {
            return await this.prisma.bugBountyProgram.findMany({
                where: { clientId: input.requesterId },
                orderBy: { createdAt: 'desc' },
                select: this.programSelect,
            });
        }
        if (input.role === client_1.UserRole.PROVIDER) {
            return await this.prisma.bugBountyProgram.findMany({
                where: {
                    status: client_1.BugBountyProgramStatus.ACTIVE,
                    allowedResearcherIds: { has: input.requesterId },
                },
                orderBy: { createdAt: 'desc' },
                select: this.programSelect,
            });
        }
        return [];
    }
    async getProgram(input) {
        const program = await this.prisma.bugBountyProgram.findUnique({
            where: { id: input.id },
            select: this.programSelect,
        });
        if (!program)
            throw new common_1.NotFoundException('Program not found');
        if (input.role === client_1.UserRole.ADMIN)
            return program;
        if (program.clientId === input.requesterId)
            return program;
        if (input.role === client_1.UserRole.PROVIDER &&
            program.status === client_1.BugBountyProgramStatus.ACTIVE &&
            program.allowedResearcherIds.includes(input.requesterId)) {
            return program;
        }
        throw new common_1.ForbiddenException('You do not have access to this program');
    }
    async createBugReport(input) {
        if (input.role !== client_1.UserRole.PROVIDER) {
            throw new common_1.ForbiddenException('Only researchers (providers) can submit bounty reports');
        }
        const program = await this.prisma.bugBountyProgram.findUnique({
            where: { id: input.programId },
            select: {
                id: true,
                clientId: true,
                status: true,
                allowedResearcherIds: true,
            },
        });
        if (!program)
            throw new common_1.NotFoundException('Program not found');
        if (program.status !== client_1.BugBountyProgramStatus.ACTIVE) {
            throw new common_1.BadRequestException('Program is not accepting submissions');
        }
        if (!program.allowedResearcherIds.includes(input.researcherId)) {
            throw new common_1.ForbiddenException('You are not invited to this private program');
        }
        const created = await this.prisma.bugReport.create({
            data: {
                programId: input.programId,
                researcherId: input.researcherId,
                title: input.title,
                description: input.description,
                severity: input.severity,
                status: client_1.BugReportStatus.SUBMITTED,
            },
            select: this.bugReportSelect,
        });
        await this.notifications.create({
            userId: program.clientId,
            type: client_1.NotificationType.BUG_BOUNTY_REPORT_SUBMITTED,
            message: `New vulnerability submission on bounty program (${created.title})`,
        });
        return created;
    }
    async listReportsForProgram(input) {
        const program = await this.prisma.bugBountyProgram.findUnique({
            where: { id: input.programId },
            select: {
                id: true,
                clientId: true,
                status: true,
                allowedResearcherIds: true,
            },
        });
        if (!program)
            throw new common_1.NotFoundException('Program not found');
        if (input.role === client_1.UserRole.ADMIN) {
            return await this.prisma.bugReport.findMany({
                where: { programId: input.programId },
                orderBy: { createdAt: 'desc' },
                select: this.bugReportSelect,
            });
        }
        if (program.clientId === input.requesterId) {
            return await this.prisma.bugReport.findMany({
                where: { programId: input.programId },
                orderBy: { createdAt: 'desc' },
                select: this.bugReportSelect,
            });
        }
        if (input.role === client_1.UserRole.PROVIDER &&
            program.allowedResearcherIds.includes(input.requesterId)) {
            return await this.prisma.bugReport.findMany({
                where: { programId: input.programId, researcherId: input.requesterId },
                orderBy: { createdAt: 'desc' },
                select: this.bugReportSelect,
            });
        }
        throw new common_1.ForbiddenException('You cannot view reports for this program');
    }
    async updateBugReportStatus(input) {
        if (input.role === client_1.UserRole.ADMIN) {
            return await this.patchReportStatus(input.reportId, input.status);
        }
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only program owners can update bounty report status');
        }
        const report = await this.prisma.bugReport.findUnique({
            where: { id: input.reportId },
            select: {
                id: true,
                program: { select: { clientId: true } },
            },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        if (report.program.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only the program owner can triage bounty submissions');
        }
        return await this.patchReportStatus(input.reportId, input.status);
    }
    async patchReportStatus(reportId, status) {
        const allowed = [
            client_1.BugReportStatus.VALID,
            client_1.BugReportStatus.REJECTED,
            client_1.BugReportStatus.DUPLICATE,
        ];
        if (!allowed.includes(status)) {
            throw new common_1.BadRequestException('Invalid status transition for bounty triage');
        }
        return await this.prisma.bugReport.update({
            where: { id: reportId },
            data: { status },
            select: this.bugReportSelect,
        });
    }
};
exports.BountyService = BountyService;
exports.BountyService = BountyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], BountyService);
//# sourceMappingURL=bounty.service.js.map