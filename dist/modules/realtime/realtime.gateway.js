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
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const event_emitter_1 = require("@nestjs/event-emitter");
const websockets_1 = require("@nestjs/websockets");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_module_1 = require("../../redis/redis.module");
const domain_events_service_1 = require("./domain-events.service");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor(jwt, config, prisma, redis) {
        this.jwt = jwt;
        this.config = config;
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
    }
    joinUser(client) {
        const userId = client.data.userId;
        if (!userId)
            return { ok: false };
        void client.join(`user:${userId}`);
        return { ok: true, room: `user:${userId}` };
    }
    handleConnection(client) {
        try {
            const token = (typeof client.handshake.auth?.token === 'string' && client.handshake.auth.token) ||
                (typeof client.handshake.query?.token === 'string' && client.handshake.query.token);
            if (!token) {
                throw new common_1.UnauthorizedException('Missing token');
            }
            const secret = this.config.get('JWT_ACCESS_SECRET') ?? 'change-me-access';
            const payload = this.jwt.verify(token, { secret });
            client.data.userId = payload.sub;
            client.data.role = payload.role;
        }
        catch (e) {
            this.logger.warn(`WS disconnect: ${e instanceof Error ? e.message : e}`);
            client.disconnect(true);
        }
    }
    async joinProject(client, body) {
        const userId = client.data.userId;
        const projectId = body?.projectId;
        if (!userId || !projectId)
            return { ok: false, error: 'projectId required' };
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true, selectedProviderId: true },
        });
        if (!project)
            return { ok: false, error: 'not_found' };
        const role = client.data.role;
        const ok = role === 'ADMIN' || project.clientId === userId || project.selectedProviderId === userId;
        if (!ok)
            return { ok: false, error: 'forbidden' };
        await client.join(`project:${projectId}`);
        return { ok: true, room: `project:${projectId}` };
    }
    async typing(client, body) {
        const userId = client.data.userId;
        const projectId = body?.projectId;
        if (!userId || !projectId)
            return;
        const key = `typing:${projectId}:${userId}`;
        if (body?.typing) {
            await this.redis.setex(key, 5, '1');
        }
        else {
            await this.redis.del(key);
        }
        client.to(`project:${projectId}`).emit('typing', { userId, typing: Boolean(body?.typing) });
    }
    presence(client, body) {
        const userId = client.data.userId;
        const projectId = body?.projectId;
        if (!userId || !projectId)
            return;
        client.to(`project:${projectId}`).emit('presence', { userId, state: 'online' });
    }
    broadcastMessage(payload) {
        this.server.to(`project:${payload.projectId}`).emit('message', payload.message);
    }
    broadcastNotification(payload) {
        this.server.to(`user:${payload.userId}`).emit('notification', payload.notification);
    }
    broadcastBid(payload) {
        this.server.to(`project:${payload.projectId}`).emit('bid', payload.bid);
    }
    broadcastMilestone(payload) {
        this.server.to(`project:${payload.projectId}`).emit('milestone', payload.milestone);
    }
    broadcastReport(payload) {
        this.server.to(`project:${payload.projectId}`).emit('report', payload.report);
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinUser'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "joinUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinProject'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "joinProject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "typing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('presence'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "presence", null);
__decorate([
    (0, event_emitter_1.OnEvent)(domain_events_service_1.HD_MESSAGE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "broadcastMessage", null);
__decorate([
    (0, event_emitter_1.OnEvent)(domain_events_service_1.HD_NOTIFICATION),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "broadcastNotification", null);
__decorate([
    (0, event_emitter_1.OnEvent)(domain_events_service_1.HD_BID),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "broadcastBid", null);
__decorate([
    (0, event_emitter_1.OnEvent)(domain_events_service_1.HD_MILESTONE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "broadcastMilestone", null);
__decorate([
    (0, event_emitter_1.OnEvent)(domain_events_service_1.HD_REPORT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "broadcastReport", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/workspace',
        cors: { origin: true, credentials: true },
    }),
    __param(3, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService, Function])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map