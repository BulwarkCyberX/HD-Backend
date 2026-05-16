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
const prisma_service_1 = require("../../prisma/prisma.service");
let DisputesService = class DisputesService {
    constructor(prisma) {
        this.prisma = prisma;
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
    async listAdmin(role) {
        if (role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        return this.prisma.dispute.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            select: this.select,
        });
    }
    async addComment(input) {
        const d = await this.prisma.dispute.findUnique({
            where: { id: input.disputeId },
            select: { id: true, projectId: true },
        });
        if (!d)
            throw new common_1.NotFoundException('Dispute not found');
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
    async resolve(input) {
        if (input.role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DisputesService);
//# sourceMappingURL=disputes.service.js.map