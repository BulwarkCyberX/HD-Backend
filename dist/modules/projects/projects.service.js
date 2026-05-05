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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    projectSelect = {
        id: true,
        title: true,
        description: true,
        assets: true,
        inScope: true,
        outOfScope: true,
        testingWindow: true,
        budgetType: true,
        budgetAmount: true,
        timeline: true,
        visibility: true,
        clientId: true,
        selectedProviderId: true,
        selectedProvider: {
            select: {
                id: true,
                email: true,
                providerProfile: {
                    select: {
                        rating: true,
                        totalReviews: true,
                        completedProjects: true,
                        validReportCount: true,
                        reputationScore: true,
                    },
                },
            },
        },
        review: {
            select: {
                id: true,
                rating: true,
                comment: true,
                clientId: true,
                providerId: true,
                createdAt: true,
            },
        },
        payment: {
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                createdAt: true,
            },
        },
        status: true,
        createdAt: true,
    };
    async create(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can create projects');
        }
        return await this.prisma.project.create({
            data: {
                title: input.title,
                description: input.description,
                assets: input.assets,
                inScope: input.inScope,
                outOfScope: input.outOfScope,
                testingWindow: input.testingWindow,
                budgetType: input.budgetType,
                budgetAmount: input.budgetAmount,
                timeline: input.timeline,
                visibility: input.visibility,
                clientId: input.userId,
                status: client_1.ProjectStatus.DRAFT,
            },
            select: this.projectSelect,
        });
    }
    async listAll() {
        return await this.prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            select: this.projectSelect,
        });
    }
    async getById(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            select: this.projectSelect,
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        return project;
    }
    async completeProject(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can complete projects');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, status: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can complete project');
        }
        const validReportsCount = await this.prisma.report.count({
            where: { projectId: input.projectId, status: client_1.ReportStatus.VALID },
        });
        if (validReportsCount === 0 && !input.explicitClientConfirmation) {
            throw new common_1.BadRequestException('No validated report found. Pass explicitClientConfirmation=true to complete project anyway.');
        }
        return await this.prisma.project.update({
            where: { id: input.projectId },
            data: { status: client_1.ProjectStatus.COMPLETED },
            select: this.projectSelect,
        });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map