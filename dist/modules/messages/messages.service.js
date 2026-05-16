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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const domain_events_service_1 = require("../realtime/domain-events.service");
let MessagesService = class MessagesService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async assertProjectParticipant(projectId, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, clientId: true, selectedProviderId: true },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const isParticipant = project.clientId === userId || project.selectedProviderId === userId;
        if (!isParticipant)
            throw new common_1.ForbiddenException('Only workspace participants can access messages');
        return project;
    }
    async create(input) {
        await this.assertProjectParticipant(input.projectId, input.senderId);
        const created = await this.prisma.message.create({
            data: {
                projectId: input.projectId,
                senderId: input.senderId,
                message: input.message,
            },
            select: {
                id: true,
                projectId: true,
                senderId: true,
                message: true,
                createdAt: true,
                sender: { select: { id: true, email: true, role: true } },
                files: {
                    select: {
                        id: true,
                        originalName: true,
                        mimeType: true,
                        size: true,
                        createdAt: true,
                    },
                },
            },
        });
        this.events.messageCreated({ projectId: input.projectId, message: created });
        return created;
    }
    async listByProject(input) {
        await this.assertProjectParticipant(input.projectId, input.requesterId);
        return await this.prisma.message.findMany({
            where: { projectId: input.projectId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                projectId: true,
                senderId: true,
                message: true,
                createdAt: true,
                sender: { select: { id: true, email: true, role: true } },
                files: {
                    select: {
                        id: true,
                        originalName: true,
                        mimeType: true,
                        size: true,
                        createdAt: true,
                    },
                },
            },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        domain_events_service_1.DomainEventsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map