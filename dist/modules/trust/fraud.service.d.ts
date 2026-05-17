import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class FraudService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkBidVelocity(providerId: string): Promise<number>;
    checkReportVelocity(providerId: string): Promise<number>;
    listFlaggedUsers(limit?: number): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        id: string;
        updatedAt: Date;
        userId: string;
        score: number;
        reasons: Prisma.JsonValue;
    }[]>;
    private flagUser;
}
