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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    reviewSelect = {
        id: true,
        projectId: true,
        clientId: true,
        providerId: true,
        rating: true,
        comment: true,
        createdAt: true,
        provider: {
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
    };
    async create(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can submit reviews');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: {
                id: true,
                clientId: true,
                selectedProviderId: true,
                status: true,
            },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can submit review');
        }
        if (!project.selectedProviderId) {
            throw new common_1.BadRequestException('Project has no selected provider');
        }
        const providerId = project.selectedProviderId;
        if (project.status !== client_1.ProjectStatus.COMPLETED) {
            throw new common_1.BadRequestException('Review can be submitted only after project completion');
        }
        const existing = await this.prisma.review.findUnique({
            where: { projectId: input.projectId },
            select: { id: true },
        });
        if (existing) {
            throw new common_1.BadRequestException('Review already submitted for this project');
        }
        return await this.prisma.$transaction(async (tx) => {
            const created = await tx.review.create({
                data: {
                    projectId: input.projectId,
                    clientId: input.requesterId,
                    providerId,
                    rating: input.rating,
                    comment: input.comment,
                },
                select: this.reviewSelect,
            });
            const ratings = await tx.review.findMany({
                where: { providerId },
                select: { rating: true },
            });
            const totalReviews = ratings.length;
            const averageRating = totalReviews === 0
                ? 0
                : ratings.reduce((acc, row) => acc + row.rating, 0) / totalReviews;
            const profile = await tx.providerProfile.findUnique({
                where: { userId: providerId },
                select: { validReportCount: true },
            });
            if (!profile) {
                throw new common_1.NotFoundException('Provider profile not found');
            }
            const completedProjects = totalReviews;
            const reputationScore = averageRating * 0.5 + profile.validReportCount * 0.3 + completedProjects * 0.2;
            await tx.providerProfile.update({
                where: { userId: providerId },
                data: {
                    rating: averageRating,
                    totalReviews,
                    completedProjects,
                    reputationScore,
                },
            });
            return created;
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map