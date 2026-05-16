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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let OrganizationsService = class OrganizationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can create organizations');
        }
        const org = await this.prisma.organization.create({
            data: {
                name: input.name,
                slug: input.slug,
                members: {
                    create: { userId: input.ownerId, role: client_1.OrganizationMemberRole.OWNER },
                },
            },
            select: { id: true, name: true, slug: true, createdAt: true },
        });
        return org;
    }
    async listMine(userId) {
        return this.prisma.organization.findMany({
            where: { members: { some: { userId } } },
            select: {
                id: true,
                name: true,
                slug: true,
                createdAt: true,
                members: {
                    where: { userId },
                    select: { role: true },
                },
                _count: { select: { members: true, projects: true } },
            },
        });
    }
    async getById(orgId, requesterId) {
        const member = await this.prisma.organizationMember.findFirst({
            where: { organizationId: orgId, userId: requesterId },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this organization');
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                slug: true,
                createdAt: true,
                members: {
                    select: {
                        id: true,
                        role: true,
                        createdAt: true,
                        user: { select: { id: true, email: true, firstName: true, lastName: true } },
                    },
                },
                projects: {
                    select: {
                        project: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                budgetAmount: true,
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        return {
            ...org,
            projects: org.projects.map((p) => p.project),
        };
    }
    async addMember(input) {
        await this.assertAdminOrOwner(input.orgId, input.requesterId);
        const user = await this.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
        if (!user)
            throw new common_1.NotFoundException('User not found for email');
        try {
            return await this.prisma.organizationMember.create({
                data: {
                    organizationId: input.orgId,
                    userId: user.id,
                    role: input.role,
                },
                select: { id: true, role: true, userId: true },
            });
        }
        catch {
            throw new common_1.BadRequestException('Member may already exist');
        }
    }
    async linkProject(input) {
        await this.assertMember(input.orgId, input.requesterId);
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, title: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only the project owner can link it to an organization');
        }
        const existing = await this.prisma.organizationProject.findUnique({
            where: { projectId: input.projectId },
        });
        if (existing && existing.organizationId !== input.orgId) {
            throw new common_1.BadRequestException('Project is already linked to another organization');
        }
        if (existing)
            return { organizationId: input.orgId, projectId: input.projectId };
        return this.prisma.organizationProject.create({
            data: { organizationId: input.orgId, projectId: input.projectId },
            select: { organizationId: true, projectId: true },
        });
    }
    async unlinkProject(input) {
        await this.assertMember(input.orgId, input.requesterId);
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { clientId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only the project owner can unlink it');
        }
        const link = await this.prisma.organizationProject.findFirst({
            where: { organizationId: input.orgId, projectId: input.projectId },
        });
        if (!link)
            throw new common_1.NotFoundException('Project is not linked to this organization');
        await this.prisma.organizationProject.delete({
            where: {
                organizationId_projectId: {
                    organizationId: input.orgId,
                    projectId: input.projectId,
                },
            },
        });
        return { ok: true };
    }
    async listLinkableProjects(orgId, requesterId) {
        await this.assertMember(orgId, requesterId);
        const linked = await this.prisma.organizationProject.findMany({
            where: { organizationId: orgId },
            select: { projectId: true },
        });
        const linkedIds = linked.map((l) => l.projectId);
        return this.prisma.project.findMany({
            where: {
                clientId: requesterId,
                ...(linkedIds.length > 0 ? { id: { notIn: linkedIds } } : {}),
                organizationLink: null,
            },
            select: { id: true, title: true, status: true, budgetAmount: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async assertMember(orgId, userId) {
        const m = await this.prisma.organizationMember.findFirst({
            where: { organizationId: orgId, userId },
        });
        if (!m)
            throw new common_1.ForbiddenException('Not a member of this organization');
    }
    async assertAdminOrOwner(orgId, userId) {
        const m = await this.prisma.organizationMember.findFirst({
            where: {
                organizationId: orgId,
                userId,
                role: { in: [client_1.OrganizationMemberRole.OWNER, client_1.OrganizationMemberRole.ADMIN] },
            },
        });
        if (!m)
            throw new common_1.ForbiddenException('Insufficient organization permissions');
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map