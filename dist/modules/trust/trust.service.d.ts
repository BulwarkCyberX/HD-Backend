import { PrismaService } from '../../prisma/prisma.service';
export declare class TrustService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    logModeration(input: {
        actorId: string;
        action: string;
        targetType: string;
        targetId: string;
        metadata?: Record<string, unknown>;
    }): Promise<{
        id: string;
        createdAt: Date;
    }>;
}
