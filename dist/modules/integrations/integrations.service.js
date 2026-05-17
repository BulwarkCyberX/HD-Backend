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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const reports_service_1 = require("../reports/reports.service");
const webhook_dispatcher_service_1 = require("./webhook-dispatcher.service");
const api_scopes_1 = require("./api-scopes");
let IntegrationsService = class IntegrationsService {
    constructor(prisma, webhooks, reports) {
        this.prisma = prisma;
        this.webhooks = webhooks;
        this.reports = reports;
    }
    async listApiKeys(userId) {
        return this.prisma.apiKey.findMany({
            where: { userId, revokedAt: null },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                label: true,
                keyPrefix: true,
                scopes: true,
                lastUsedAt: true,
                createdAt: true,
            },
        });
    }
    async createApiKey(userId, label, scopes) {
        const resolvedScopes = (0, api_scopes_1.parseApiScopes)(scopes);
        const raw = `hd_live_${(0, crypto_1.randomBytes)(24).toString('hex')}`;
        const keyHash = (0, crypto_1.createHash)('sha256').update(raw, 'utf8').digest('hex');
        const keyPrefix = raw.slice(0, 16);
        await this.prisma.apiKey.create({
            data: { userId, label, keyPrefix, keyHash, scopes: resolvedScopes },
        });
        return { apiKey: raw, keyPrefix, label, scopes: resolvedScopes };
    }
    async revokeApiKey(userId, keyId) {
        const row = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } });
        if (!row)
            throw new common_1.NotFoundException('API key not found');
        await this.prisma.apiKey.update({ where: { id: keyId }, data: { revokedAt: new Date() } });
        return { ok: true };
    }
    async validateApiKey(rawKey) {
        const keyHash = (0, crypto_1.createHash)('sha256').update(rawKey, 'utf8').digest('hex');
        const row = await this.prisma.apiKey.findFirst({
            where: { keyHash, revokedAt: null },
            select: { id: true, userId: true, scopes: true },
        });
        if (!row)
            return null;
        void this.prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
        return row;
    }
    async listWebhooks(userId) {
        return this.prisma.webhookEndpoint.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                label: true,
                url: true,
                events: true,
                enabled: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { deliveries: true } },
            },
        });
    }
    async createWebhook(userId, input) {
        const secret = (0, crypto_1.randomBytes)(32).toString('hex');
        const row = await this.prisma.webhookEndpoint.create({
            data: {
                userId,
                label: input.label,
                url: input.url,
                secret,
                events: input.events,
            },
            select: { id: true, label: true, url: true, events: true, enabled: true, createdAt: true },
        });
        return { ...row, signingSecret: secret };
    }
    async deleteWebhook(userId, id) {
        const row = await this.prisma.webhookEndpoint.findFirst({ where: { id, userId } });
        if (!row)
            throw new common_1.NotFoundException('Webhook not found');
        await this.prisma.webhookEndpoint.delete({ where: { id } });
        return { ok: true };
    }
    async listDeliveries(userId, endpointId) {
        const endpoint = await this.prisma.webhookEndpoint.findFirst({
            where: { id: endpointId, userId },
            select: { id: true },
        });
        if (!endpoint)
            throw new common_1.ForbiddenException('Webhook not found');
        return this.prisma.webhookDelivery.findMany({
            where: { endpointId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                event: true,
                success: true,
                statusCode: true,
                errorMessage: true,
                createdAt: true,
            },
        });
    }
    async listProjectsForApiUser(userId, cursor, limit = 50) {
        const take = Math.min(Math.max(limit, 1), 100);
        const rows = await this.prisma.project.findMany({
            where: {
                OR: [{ clientId: userId }, { selectedProviderId: userId }],
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: take + 1,
            select: {
                id: true,
                title: true,
                status: true,
                budgetType: true,
                budgetAmount: true,
                visibility: true,
                createdAt: true,
            },
        });
        const hasMore = rows.length > take;
        const items = hasMore ? rows.slice(0, take) : rows;
        return {
            items,
            nextCursor: hasMore ? items[items.length - 1]?.createdAt.toISOString() : null,
        };
    }
    async assertProjectAccess(userId, projectId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.clientId !== userId && project.selectedProviderId !== userId) {
            throw new common_1.ForbiddenException('Not a participant on this project');
        }
        const role = project.clientId === userId
            ? client_1.UserRole.CLIENT
            : project.selectedProviderId === userId
                ? client_1.UserRole.PROVIDER
                : null;
        return { project, role: role };
    }
    async getProjectForApiUser(userId, projectId) {
        await this.assertProjectAccess(userId, projectId);
        return this.prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                budgetType: true,
                budgetAmount: true,
                timeline: true,
                visibility: true,
                clientId: true,
                selectedProviderId: true,
                createdAt: true,
                payment: { select: { status: true, amount: true, currency: true } },
                _count: { select: { reports: true, milestones: true } },
            },
        });
    }
    async listReportsForApiUser(userId, projectId) {
        const { project, role } = await this.assertProjectAccess(userId, projectId);
        const allowedStatuses = role === client_1.UserRole.CLIENT
            ? [client_1.ReportStatus.VALID, client_1.ReportStatus.NEED_MORE_INFO, client_1.ReportStatus.REJECTED]
            : undefined;
        return this.prisma.report.findMany({
            where: {
                projectId,
                ...(role === client_1.UserRole.PROVIDER ? { submittedBy: userId } : {}),
                ...(allowedStatuses ? { status: { in: allowedStatuses } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                title: true,
                severity: true,
                status: true,
                createdAt: true,
            },
        });
    }
    async listMilestonesForApiUser(userId, projectId) {
        await this.assertProjectAccess(userId, projectId);
        return this.prisma.projectMilestone.findMany({
            where: { projectId },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                title: true,
                amount: true,
                currency: true,
                status: true,
                releasedAt: true,
                createdAt: true,
            },
        });
    }
    async sendWebhookTest(userId, endpointId) {
        const endpoint = await this.prisma.webhookEndpoint.findFirst({
            where: { id: endpointId, userId },
            select: { id: true },
        });
        if (!endpoint)
            throw new common_1.NotFoundException('Webhook not found');
        await this.webhooks.dispatchTest(userId, endpointId);
        return { ok: true, message: 'Test webhook queued' };
    }
    async retryDelivery(userId, deliveryId) {
        const delivery = await this.getDeliveryForRetry(userId, deliveryId);
        const payload = delivery.payload;
        await this.webhooks.replayDelivery(delivery.endpointId, delivery.event, payload);
        return { ok: true, message: 'Delivery re-queued' };
    }
    async getDeliveryForRetry(userId, deliveryId) {
        const delivery = await this.prisma.webhookDelivery.findFirst({
            where: { id: deliveryId, endpoint: { userId } },
            select: {
                id: true,
                endpointId: true,
                event: true,
                payload: true,
                success: true,
            },
        });
        if (!delivery)
            throw new common_1.NotFoundException('Delivery not found');
        return delivery;
    }
    async createReportForApiUser(userId, projectId, body) {
        await this.assertProjectAccess(userId, projectId);
        return this.reports.create({
            projectId,
            submittedBy: userId,
            title: body.title,
            description: body.description,
            severity: body.severity,
        });
    }
    async setWebhookEnabled(userId, id, enabled) {
        const row = await this.prisma.webhookEndpoint.findFirst({ where: { id, userId } });
        if (!row)
            throw new common_1.NotFoundException('Webhook not found');
        return this.prisma.webhookEndpoint.update({
            where: { id },
            data: { enabled },
            select: { id: true, label: true, enabled: true },
        });
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => reports_service_1.ReportsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        webhook_dispatcher_service_1.WebhookDispatcherService,
        reports_service_1.ReportsService])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map