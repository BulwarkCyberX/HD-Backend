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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                entityId: true,
                createdAt: true,
                entity: { select: { id: true, type: true, name: true, verificationStatus: true, createdAt: true } },
                providerProfile: true,
                clientProfile: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async getById(requester, id) {
        if (requester.role !== client_1.UserRole.ADMIN && requester.userId !== id) {
            throw new common_1.ForbiddenException('Forbidden');
        }
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                entityId: true,
                createdAt: true,
                entity: { select: { id: true, type: true, name: true, verificationStatus: true, createdAt: true } },
                providerProfile: true,
                clientProfile: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async getProviderProfile(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
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
        });
        if (!user || user.role !== client_1.UserRole.PROVIDER || !user.providerProfile) {
            throw new common_1.NotFoundException('Provider profile not found');
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map