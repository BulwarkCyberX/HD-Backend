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
exports.PlatformFeeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PlatformFeeService = class PlatformFeeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveFeeBps() {
        const row = await this.prisma.platformFeeConfig.findFirst({
            where: {
                effectiveFrom: { lte: new Date() },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
            },
            orderBy: { effectiveFrom: 'desc' },
            select: { clientFeeBps: true, providerFeeBps: true },
        });
        return row ?? { clientFeeBps: 0, providerFeeBps: 0 };
    }
};
exports.PlatformFeeService = PlatformFeeService;
exports.PlatformFeeService = PlatformFeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformFeeService);
//# sourceMappingURL=platform-fee.service.js.map