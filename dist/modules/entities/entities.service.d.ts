import { PrismaService } from '../../prisma/prisma.service';
import { EntityType } from '@prisma/client';
export declare class EntitiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createForUser(input: {
        userId: string;
        type: EntityType;
        name: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.EntityType;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
    }>;
}
