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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let OrganizationsService = class OrganizationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        if (input.role !== client_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only clients can create organizations');
        }
        const org = await this.prisma.organization.create({
            data: {
                name: input.name,
                slug: input.slug,
                members: {
                    create: { userId: input.ownerId, role: client_1.OrganizationMemberRole.OWNER },
                },
            },
            select: { id: true, name: true, slug: true, createdAt: true },
        });
        return org;
    }
    async listMine(userId) {
        return this.prisma.organization.findMany({
            where: { members: { some: { userId } } },
            select: {
                id: true,
                name: true,
                slug: true,
                members: {
                    where: { userId },
                    select: { role: true },
                },
            },
        });
    }
    async addMember(input) {
        await this.assertAdminOrOwner(input.orgId, input.requesterId);
        const user = await this.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
        if (!user)
            throw new common_1.NotFoundException('User not found for email');
        try {
            return await this.prisma.organizationMember.create({
                data: {
                    organizationId: input.orgId,
                    userId: user.id,
                    role: input.role,
                },
                select: { id: true, role: true, userId: true },
            });
        }
        catch {
            throw new common_1.BadRequestException('Member may already exist');
        }
    }
    async assertAdminOrOwner(orgId, userId) {
        const m = await this.prisma.organizationMember.findFirst({
            where: {
                organizationId: orgId,
                userId,
                role: { in: [client_1.OrganizationMemberRole.OWNER, client_1.OrganizationMemberRole.ADMIN] },
            },
        });
        if (!m)
            throw new common_1.ForbiddenException('Insufficient organization permissions');
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map