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
exports.PublicService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let PublicService = class PublicService {
    constructor(prisma) {
        this.prisma = prisma;
        this.publicProjectSelect = {
            id: true,
            title: true,
            description: true,
            budgetType: true,
            budgetAmount: true,
            timeline: true,
            visibility: true,
            status: true,
            inScope: true,
            outOfScope: true,
            testingWindow: true,
            createdAt: true,
            projectSkills: {
                select: { skill: { select: { slug: true, label: true } } },
            },
        };
    }
    async listPublicProjects(input) {
        const q = input?.q?.trim();
        const orderBy = input?.sort === 'budget_asc'
            ? { budgetAmount: 'asc' }
            : input?.sort === 'budget_desc'
                ? { budgetAmount: 'desc' }
                : { createdAt: 'desc' };
        return this.prisma.project.findMany({
            where: {
                visibility: client_1.ProjectVisibility.PUBLIC,
                status: { in: ['ACTIVE', 'IN_PROGRESS'] },
                ...(q
                    ? {
                        OR: [
                            { title: { contains: q, mode: 'insensitive' } },
                            { description: { contains: q, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
                ...(input?.minBudget != null ? { budgetAmount: { gte: input.minBudget } } : {}),
                ...(input?.maxBudget != null ? { budgetAmount: { lte: input.maxBudget } } : {}),
                ...(input?.budgetType ? { budgetType: input.budgetType } : {}),
                ...(input?.skill
                    ? {
                        projectSkills: {
                            some: { skill: { slug: input.skill } },
                        },
                    }
                    : {}),
            },
            orderBy,
            take: 60,
            select: this.publicProjectSelect,
        });
    }
    async getPublicProject(id) {
        const project = await this.prisma.project.findFirst({
            where: { id, visibility: client_1.ProjectVisibility.PUBLIC },
            select: this.publicProjectSelect,
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        return project;
    }
    async getPublicProvider(id) {
        const user = await this.prisma.user.findFirst({
            where: { id, role: client_1.UserRole.PROVIDER },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                country: true,
                city: true,
                createdAt: true,
                providerProfile: {
                    select: {
                        skills: true,
                        certifications: true,
                        rating: true,
                        totalReviews: true,
                        completedProjects: true,
                        validReportCount: true,
                        reputationScore: true,
                        bio: true,
                        portfolio: true,
                        availabilityStatus: true,
                        providerSkills: {
                            select: { skill: { select: { slug: true, label: true } } },
                        },
                    },
                },
            },
        });
        if (!user?.providerProfile)
            throw new common_1.NotFoundException('Provider not found');
        return {
            id: user.id,
            displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Security Provider',
            country: user.country,
            city: user.city,
            memberSince: user.createdAt,
            profile: user.providerProfile,
        };
    }
    async listFeaturedProviders() {
        return this.prisma.user.findMany({
            where: { role: client_1.UserRole.PROVIDER, providerProfile: { isNot: null } },
            orderBy: { providerProfile: { reputationScore: 'desc' } },
            take: 8,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                providerProfile: {
                    select: {
                        rating: true,
                        reputationScore: true,
                        completedProjects: true,
                        validReportCount: true,
                        bio: true,
                        availabilityStatus: true,
                        skills: true,
                    },
                },
            },
        });
    }
};
exports.PublicService = PublicService;
exports.PublicService = PublicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicService);
//# sourceMappingURL=public.service.js.map