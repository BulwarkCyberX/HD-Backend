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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ReportsService = class ReportsService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.reportSelect = {
            id: true,
            projectId: true,
            submittedBy: true,
            title: true,
            description: true,
            severity: true,
            status: true,
            triageNotes: true,
            validatedBy: true,
            createdAt: true,
            submitter: { select: { id: true, email: true, role: true } },
            validator: { select: { id: true, email: true, role: true } },
            files: {
                select: {
                    id: true,
                    originalName: true,
                    mimeType: true,
                    size: true,
                    createdAt: true,
                },
            },
            project: {
                select: {
                    id: true,
                    title: true,
                    clientId: true,
                    selectedProviderId: true,
                },
            },
        };
    }
    async assertProjectParticipant(projectId, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const isParticipant = project.clientId === userId || project.selectedProviderId === userId;
        if (!isParticipant)
            throw new common_1.ForbiddenException('Only workspace participants can access reports');
        return project;
    }
    async create(input) {
        const project = await this.assertProjectParticipant(input.projectId, input.submittedBy);
        if (project.selectedProviderId !== input.submittedBy) {
            throw new common_1.ForbiddenException('Only selected provider can submit reports');
        }
        const created = await this.prisma.report.create({
            data: {
                projectId: input.projectId,
                submittedBy: input.submittedBy,
                title: input.title,
                description: input.description,
                severity: input.severity,
                status: client_1.ReportStatus.SUBMITTED,
            },
            select: this.reportSelect,
        });
        await this.notifications.create({
            userId: project.clientId,
            type: client_1.NotificationType.REPORT_SUBMITTED,
            message: `New security report submitted on "${created.project.title}"`,
        });
        return created;
    }
    async listByProject(input) {
        const project = input.requesterRole === client_1.UserRole.ADMIN
            ? await this.prisma.project.findUnique({
                where: { id: input.projectId },
                select: { id: true, clientId: true, selectedProviderId: true },
            })
            : await this.assertProjectParticipant(input.projectId, input.requesterId);
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        let allowedStatuses;
        if (input.requesterRole === client_1.UserRole.CLIENT) {
            allowedStatuses = [client_1.ReportStatus.VALID, client_1.ReportStatus.NEED_MORE_INFO, client_1.ReportStatus.REJECTED];
        }
        return await this.prisma.report.findMany({
            where: {
                projectId: input.projectId,
                ...(input.requesterRole === client_1.UserRole.PROVIDER ? { submittedBy: input.requesterId } : {}),
                ...(allowedStatuses ? { status: { in: allowedStatuses } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            select: this.reportSelect,
        });
    }
    async listAllForAdmin(input) {
        if (input.requesterRole !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admin can access triage report list');
        }
        return await this.prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            select: this.reportSelect,
        });
    }
    async triage(input) {
        if (input.requesterRole !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admin can triage reports');
        }
        const existing = await this.prisma.report.findUnique({
            where: { id: input.reportId },
            select: { id: true, status: true, submittedBy: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Report not found');
        const wasAlreadyValid = existing.status === client_1.ReportStatus.VALID;
        const updated = await this.prisma.$transaction(async (tx) => {
            const row = await tx.report.update({
                where: { id: input.reportId },
                data: {
                    status: input.status,
                    triageNotes: input.triageNotes,
                    validatedBy: input.requesterId,
                },
                select: this.reportSelect,
            });
            if (!wasAlreadyValid && input.status === 'VALID') {
                await tx.providerProfile.update({
                    where: { userId: existing.submittedBy },
                    data: {
                        validReportCount: { increment: 1 },
                    },
                });
                const profile = await tx.providerProfile.findUnique({
                    where: { userId: existing.submittedBy },
                    select: {
                        rating: true,
                        validReportCount: true,
                        completedProjects: true,
                    },
                });
                if (profile) {
                    const reputationScore = profile.rating * 0.5 + profile.validReportCount * 0.3 + profile.completedProjects * 0.2;
                    await tx.providerProfile.update({
                        where: { userId: existing.submittedBy },
                        data: { reputationScore },
                    });
                }
            }
            return row;
        });
        if (!wasAlreadyValid && input.status === 'VALID') {
            await this.notifications.create({
                userId: existing.submittedBy,
                type: client_1.NotificationType.REPORT_VALIDATED,
                message: `Your workspace security report was marked VALID`,
            });
        }
        return updated;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map