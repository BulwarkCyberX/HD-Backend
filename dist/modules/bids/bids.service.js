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
exports.BidsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let BidsService = class BidsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    bidSelect = {
        id: true,
        projectId: true,
        providerId: true,
        proposal: true,
        price: true,
        timeline: true,
        status: true,
        createdAt: true,
        provider: {
            select: {
                id: true,
                email: true,
                providerProfile: {
                    select: {
                        bidCredits: true,
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
        if (input.role !== client_1.UserRole.PROVIDER) {
            throw new common_1.ForbiddenException('Only providers can submit bids');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true, title: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const profile = await this.prisma.providerProfile.findUnique({
            where: { userId: input.providerId },
            select: { id: true, bidCredits: true },
        });
        if (!profile)
            throw new common_1.BadRequestException('Provider profile not found');
        if (profile.bidCredits <= 0)
            throw new common_1.ForbiddenException('Insufficient bid credits');
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.providerProfile.update({
                where: { userId: input.providerId },
                data: { bidCredits: { decrement: 1 } },
            });
            return await tx.bid.create({
                data: {
                    projectId: input.projectId,
                    providerId: input.providerId,
                    proposal: input.proposal,
                    price: input.price,
                    timeline: input.timeline,
                    status: client_1.BidStatus.PENDING,
                },
                select: this.bidSelect,
            });
        });
        await this.notifications.create({
            userId: project.clientId,
            type: client_1.NotificationType.NEW_BID,
            message: `New bid on project "${project.title}"`,
        });
        return result;
    }
    async listForProject(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can view project bids');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: input.projectId },
            select: { id: true, clientId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can view bids');
        }
        return await this.prisma.bid.findMany({
            where: { projectId: input.projectId },
            orderBy: { createdAt: 'desc' },
            select: this.bidSelect,
        });
    }
    async listMine(input) {
        if (input.role !== client_1.UserRole.PROVIDER) {
            throw new common_1.ForbiddenException('Only providers can view their bids');
        }
        return await this.prisma.bid.findMany({
            where: { providerId: input.requesterId },
            orderBy: { createdAt: 'desc' },
            select: {
                ...this.bidSelect,
                project: { select: { id: true, title: true, status: true, visibility: true } },
            },
        });
    }
    async updateStatus(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can manage bids');
        }
        const bid = await this.prisma.bid.findUnique({
            where: { id: input.bidId },
            select: { id: true, project: { select: { clientId: true } } },
        });
        if (!bid)
            throw new common_1.NotFoundException('Bid not found');
        if (bid.project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can manage bid status');
        }
        if (input.status === 'REJECTED') {
            return await this.prisma.bid.update({
                where: { id: input.bidId },
                data: { status: client_1.BidStatus.REJECTED },
                select: this.bidSelect,
            });
        }
        const updatedBid = await this.prisma.$transaction(async (tx) => {
            const row = await tx.bid.update({
                where: { id: input.bidId },
                data: { status: client_1.BidStatus.ACCEPTED },
                select: this.bidSelect,
            });
            await tx.project.update({
                where: { id: row.projectId },
                data: {
                    selectedProviderId: row.providerId,
                    status: client_1.ProjectStatus.IN_PROGRESS,
                },
            });
            await tx.bid.updateMany({
                where: {
                    projectId: row.projectId,
                    id: { not: row.id },
                    status: client_1.BidStatus.PENDING,
                },
                data: { status: client_1.BidStatus.REJECTED },
            });
            return row;
        });
        const projectTitle = await this.prisma.project.findUnique({
            where: { id: updatedBid.projectId },
            select: { title: true },
        });
        await this.notifications.create({
            userId: updatedBid.providerId,
            type: client_1.NotificationType.BID_ACCEPTED,
            message: `Your bid was accepted on "${projectTitle?.title ?? 'project'}"`,
        });
        return updatedBid;
    }
};
exports.BidsService = BidsService;
exports.BidsService = BidsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], BidsService);
//# sourceMappingURL=bids.service.js.map