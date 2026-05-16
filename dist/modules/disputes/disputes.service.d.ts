import { DisputeStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class DisputesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly select;
    create(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        category: import('@prisma/client').DisputeCategory;
        title: string;
        description: string;
    }): Promise<{
        category: import(".prisma/client").$Enums.DisputeCategory;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
        updatedAt: Date;
        resolution: string | null;
        resolvedAt: Date | null;
        openedById: string;
    }>;
    listForProject(input: {
        projectId: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        category: import(".prisma/client").$Enums.DisputeCategory;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
        updatedAt: Date;
        resolution: string | null;
        resolvedAt: Date | null;
        openedById: string;
    }[]>;
    listAdmin(role: UserRole): Promise<{
        category: import(".prisma/client").$Enums.DisputeCategory;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
        updatedAt: Date;
        resolution: string | null;
        resolvedAt: Date | null;
        openedById: string;
    }[]>;
    addComment(input: {
        disputeId: string;
        requesterId: string;
        role: UserRole;
        body: string;
        internal?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        author: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        internal: boolean;
    }>;
    resolve(input: {
        disputeId: string;
        adminId: string;
        role: UserRole;
        status: DisputeStatus;
        resolution?: string;
    }): Promise<{
        category: import(".prisma/client").$Enums.DisputeCategory;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
        updatedAt: Date;
        resolution: string | null;
        resolvedAt: Date | null;
        openedById: string;
    }>;
    markReview(input: {
        disputeId: string;
        adminId: string;
        role: UserRole;
    }): Promise<{
        category: import(".prisma/client").$Enums.DisputeCategory;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
        updatedAt: Date;
        resolution: string | null;
        resolvedAt: Date | null;
        openedById: string;
    }>;
    private assertDisputeAccess;
}
