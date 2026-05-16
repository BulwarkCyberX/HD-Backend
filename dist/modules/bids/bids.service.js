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
const hourly_service_1 = require("../hourly/hourly.service");
const webhook_dispatcher_service_1 = require("../integrations/webhook-dispatcher.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const transactional_email_service_1 = require("../email/transactional-email.service");
const domain_events_service_1 = require("../realtime/domain-events.service");
let BidsService = class BidsService {
    constructor(prisma, notifications, transactional, events, hourly, webhooks) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.transactional = transactional;
        this.events = events;
        this.hourly = hourly;
        this.webhooks = webhooks;
        this.bidSelect = {
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
    }
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
        this.events.bidUpdated({ projectId: input.projectId, bid: result });
        const providerUser = await this.prisma.user.findUnique({
            where: { id: input.providerId },
            select: { email: true, firstName: true },
        });
        if (providerUser?.email) {
            void this.transactional
                .sendBidPlacedProviderConfirmation({
                to: providerUser.email,
                providerName: providerUser.firstName ?? '',
                projectTitle: project.title,
                amount: input.price,
            })
                .catch(() => undefined);
        }
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
        if (input.role !== client_1.UserRole.CLIENT && input.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only clients can manage bids');
        }
        const bid = await this.prisma.bid.findUnique({
            where: { id: input.bidId },
            select: { id: true, project: { select: { clientId: true } } },
        });
        if (!bid)
            throw new common_1.NotFoundException('Bid not found');
        if (!input.skipOwnershipCheck &&
            input.role === client_1.UserRole.CLIENT &&
            bid.project.clientId !== input.requesterId) {
            throw new common_1.ForbiddenException('Only project owner can manage bid status');
        }
        if (input.status === 'REJECTED') {
            const rejected = await this.prisma.bid.update({
                where: { id: input.bidId },
                data: { status: client_1.BidStatus.REJECTED },
                select: this.bidSelect,
            });
            this.events.bidUpdated({ projectId: rejected.projectId, bid: rejected });
            return rejected;
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
        const projectMeta = await this.prisma.project.findUnique({
            where: { id: updatedBid.projectId },
            select: { budgetType: true },
        });
        if (projectMeta?.budgetType === client_1.BudgetType.HOURLY) {
            await this.hourly.ensureEngagementForProject({
                projectId: updatedBid.projectId,
                hourlyRate: updatedBid.price,
            });
        }
        this.events.bidUpdated({ projectId: updatedBid.projectId, bid: updatedBid });
        const projectRow = await this.prisma.project.findUnique({
            where: { id: updatedBid.projectId },
            select: { clientId: true },
        });
        if (projectRow) {
            void this.webhooks.dispatch(projectRow.clientId, client_1.WebhookEventType.BID_ACCEPTED, {
                projectId: updatedBid.projectId,
                bidId: updatedBid.id,
                providerId: updatedBid.providerId,
            });
            void this.webhooks.dispatch(updatedBid.providerId, client_1.WebhookEventType.BID_ACCEPTED, {
                projectId: updatedBid.projectId,
                bidId: updatedBid.id,
                providerId: updatedBid.providerId,
            });
        }
        return updatedBid;
    }
    async acceptBidAsAdmin(bidId) {
        const bid = await this.prisma.bid.findUnique({
            where: { id: bidId },
            select: { id: true, status: true, projectId: true },
        });
        if (!bid)
            throw new common_1.NotFoundException('Bid not found');
        if (bid.status !== client_1.BidStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending bids can be accepted');
        }
        return this.updateStatus({
            requesterId: '',
            role: client_1.UserRole.ADMIN,
            bidId,
            status: 'ACCEPTED',
            skipOwnershipCheck: true,
        });
    }
};
exports.BidsService = BidsService;
exports.BidsService = BidsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        transactional_email_service_1.TransactionalEmailService,
        domain_events_service_1.DomainEventsService,
        hourly_service_1.HourlyService,
        webhook_dispatcher_service_1.WebhookDispatcherService])
], BidsService);
//# sourceMappingURL=bids.service.js.map