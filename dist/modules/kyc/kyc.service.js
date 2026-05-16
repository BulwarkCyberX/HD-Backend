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
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
function maskPan(pan) {
    const p = pan.trim().toUpperCase();
    if (p.length < 4)
        return '****';
    return `${'*'.repeat(Math.max(0, p.length - 4))}${p.slice(-4)}`;
}
function last4(account) {
    const digits = account.replace(/\D/g, '');
    return digits.slice(-4);
}
let KycService = class KycService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStatus(userId) {
        const latest = await this.prisma.kycSubmission.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                panNumberMasked: true,
                panHolderName: true,
                bankAccountLast4: true,
                bankIfsc: true,
                bankAccountHolder: true,
                adminNotes: true,
                reviewedAt: true,
                createdAt: true,
            },
        });
        return {
            status: latest?.status ?? client_1.KycStatus.NOT_STARTED,
            submission: latest,
            approved: latest?.status === client_1.KycStatus.APPROVED,
        };
    }
    async submit(input) {
        const pending = await this.prisma.kycSubmission.findFirst({
            where: { userId: input.userId, status: client_1.KycStatus.PENDING },
        });
        if (pending) {
            throw new common_1.BadRequestException('KYC submission already pending review');
        }
        const approved = await this.prisma.kycSubmission.findFirst({
            where: { userId: input.userId, status: client_1.KycStatus.APPROVED },
        });
        if (approved) {
            throw new common_1.BadRequestException('KYC already approved');
        }
        return this.prisma.kycSubmission.create({
            data: {
                userId: input.userId,
                status: client_1.KycStatus.PENDING,
                panNumberMasked: maskPan(input.panNumber),
                panHolderName: input.panHolderName.trim(),
                bankAccountLast4: last4(input.bankAccountNumber),
                bankIfsc: input.bankIfsc.trim().toUpperCase(),
                bankAccountHolder: input.bankAccountHolder.trim(),
            },
            select: {
                id: true,
                status: true,
                panNumberMasked: true,
                panHolderName: true,
                bankAccountLast4: true,
                bankIfsc: true,
                bankAccountHolder: true,
                createdAt: true,
            },
        });
    }
    async listPendingAdmin(role) {
        if (role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        return this.prisma.kycSubmission.findMany({
            where: { status: client_1.KycStatus.PENDING },
            orderBy: { createdAt: 'asc' },
            take: 100,
            select: {
                id: true,
                userId: true,
                status: true,
                panNumberMasked: true,
                panHolderName: true,
                bankAccountLast4: true,
                bankIfsc: true,
                bankAccountHolder: true,
                createdAt: true,
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }
    async review(input) {
        if (input.role !== client_1.UserRole.ADMIN)
            throw new common_1.ForbiddenException('Admin only');
        const row = await this.prisma.kycSubmission.findUnique({ where: { id: input.submissionId } });
        if (!row)
            throw new common_1.NotFoundException('KYC submission not found');
        if (row.status !== client_1.KycStatus.PENDING) {
            throw new common_1.BadRequestException('Submission is not pending');
        }
        return this.prisma.kycSubmission.update({
            where: { id: input.submissionId },
            data: {
                status: input.approve ? client_1.KycStatus.APPROVED : client_1.KycStatus.REJECTED,
                adminNotes: input.adminNotes?.trim() || null,
                reviewedById: input.adminId,
                reviewedAt: new Date(),
            },
            select: {
                id: true,
                userId: true,
                status: true,
                adminNotes: true,
                reviewedAt: true,
            },
        });
    }
    async assertWithdrawalAllowed(userId) {
        const latest = await this.prisma.kycSubmission.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { status: true },
        });
        if (latest?.status !== client_1.KycStatus.APPROVED) {
            throw new common_1.ForbiddenException('Complete KYC verification before requesting withdrawals');
        }
        const fraud = await this.prisma.fraudFlag.findUnique({ where: { userId } });
        if (fraud && fraud.score >= 80) {
            throw new common_1.ForbiddenException('Account restricted. Contact support.');
        }
    }
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KycService);
//# sourceMappingURL=kyc.service.js.map