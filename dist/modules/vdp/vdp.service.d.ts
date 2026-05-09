import { ReportSeverity, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class VdpService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly publicSelect;
    create(input: {
        clientId: string;
        role: UserRole;
        title: string;
        scope: unknown;
        policy: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        title: string;
        clientId: string;
        policy: string;
    }>;
    getPublic(id: string): Promise<{
        id: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        title: string;
        policy: string;
    }>;
    submitReport(input: {
        vdpId: string;
        title: string;
        description: string;
        contactEmail?: string;
        severity?: ReportSeverity;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.ReportSeverity | null;
        vdpId: string;
        contactEmail: string | null;
    }>;
}
