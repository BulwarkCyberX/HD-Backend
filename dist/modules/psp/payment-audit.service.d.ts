import { PspProviderName, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class PaymentAuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(input: {
        sessionId?: string;
        eventType: string;
        provider?: PspProviderName;
        providerEventId?: string;
        actorUserId?: string;
        payload?: Prisma.InputJsonValue;
    }): Promise<{
        id: string;
        createdAt: Date;
        provider: import(".prisma/client").$Enums.PspProviderName | null;
        payload: Prisma.JsonValue | null;
        actorUserId: string | null;
        eventType: string;
        providerEventId: string | null;
        sessionId: string | null;
    } | null>;
}
