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
exports.VdpService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let VdpService = class VdpService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    publicSelect = {
        id: true,
        title: true,
        scope: true,
        policy: true,
        createdAt: true,
    };
    async create(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can create VDP listings');
        }
        return await this.prisma.vdpProgram.create({
            data: {
                clientId: input.clientId,
                title: input.title,
                scope: input.scope,
                policy: input.policy,
            },
            select: {
                ...this.publicSelect,
                clientId: true,
            },
        });
    }
    async getPublic(id) {
        const row = await this.prisma.vdpProgram.findUnique({
            where: { id },
            select: this.publicSelect,
        });
        if (!row)
            throw new common_1.NotFoundException('VDP not found');
        return row;
    }
    async submitReport(input) {
        const vdp = await this.prisma.vdpProgram.findUnique({
            where: { id: input.vdpId },
            select: { id: true },
        });
        if (!vdp)
            throw new common_1.NotFoundException('VDP not found');
        return await this.prisma.vdpSubmission.create({
            data: {
                vdpId: input.vdpId,
                title: input.title,
                description: input.description,
                contactEmail: input.contactEmail,
                severity: input.severity,
            },
            select: {
                id: true,
                vdpId: true,
                title: true,
                description: true,
                contactEmail: true,
                severity: true,
                createdAt: true,
            },
        });
    }
};
exports.VdpService = VdpService;
exports.VdpService = VdpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VdpService);
//# sourceMappingURL=vdp.service.js.map