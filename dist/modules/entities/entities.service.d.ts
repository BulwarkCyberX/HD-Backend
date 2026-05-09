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
        id: string;
        createdAt: Date;
        name: string;
        type: import(".prisma/client").$Enums.EntityType;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
    }>;
}
