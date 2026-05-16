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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchProjects(input) {
        const q = input.q.trim();
        if (q.length < 2)
            return [];
        const visibilityFilter = input.role === client_1.UserRole.ADMIN
            ? {}
            : {
                OR: [{ visibility: 'PUBLIC' }, { clientId: input.requesterId }],
            };
        return this.prisma.project.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { title: { contains: q, mode: 'insensitive' } },
                            { description: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    visibilityFilter,
                ],
            },
            take: 40,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                budgetAmount: true,
                budgetType: true,
                status: true,
                visibility: true,
                createdAt: true,
                clientId: true,
            },
        });
    }
    async searchProviders(input) {
        const q = input.q.trim();
        if (q.length < 2)
            return [];
        return this.prisma.user.findMany({
            where: {
                role: client_1.UserRole.PROVIDER,
                email: { contains: q, mode: 'insensitive' },
            },
            take: 30,
            select: {
                id: true,
                email: true,
                providerProfile: {
                    select: {
                        skills: true,
                        rating: true,
                        reputationScore: true,
                        completedProjects: true,
                    },
                },
            },
        });
    }
    async listSavedSearches(userId) {
        return this.prisma.savedSearch.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, queryJson: true, createdAt: true, updatedAt: true },
        });
    }
    async createSavedSearch(userId, name, queryJson) {
        return this.prisma.savedSearch.create({
            data: { userId, name, queryJson },
            select: { id: true, name: true, queryJson: true, createdAt: true },
        });
    }
    async trendingProjects() {
        return this.prisma.project.findMany({
            where: { visibility: 'PUBLIC', status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
            take: 12,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                budgetAmount: true,
                status: true,
                createdAt: true,
            },
        });
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map