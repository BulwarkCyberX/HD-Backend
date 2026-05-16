import { DisputeStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallets/wallet.service';
export declare class DisputesService {
    private readonly prisma;
    private readonly wallets;
    constructor(prisma: PrismaService, wallets: WalletService);
    private filePublicUrl;
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
        description: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
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
        description: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
        resolution: string | null;
        resolvedAt: Date | null;
        openedById: string;
    }[]>;
    getById(input: {
        disputeId: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        comments: {
            id: string;
            createdAt: Date;
            body: string;
            author: {
                email: string;
                id: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
            internal: boolean;
        }[];
        evidence: {
            fileAsset: {
                url: string;
                id: string;
                originalName: string;
                mimeType: string;
                size: number;
            };
            id: string;
            createdAt: Date;
            note: string | null;
        }[];
        project: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.ProjectStatus;
            clientId: string;
            selectedProviderId: string | null;
        };
        category: import(".prisma/client").$Enums.DisputeCategory;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
        resolution: string | null;
        resolvedAt: Date | null;
        openedBy: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        openedById: string;
    }>;
    listAdmin(role: UserRole): Promise<{
        project: {
            id: string;
            title: string;
        };
        category: import(".prisma/client").$Enums.DisputeCategory;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
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
    addEvidence(input: {
        disputeId: string;
        requesterId: string;
        role: UserRole;
        fileAssetId: string;
        note?: string;
    }): Promise<{
        fileAsset: {
            url: string;
            id: string;
            originalName: string;
            mimeType: string;
            size: number;
        };
        id: string;
        createdAt: Date;
        note: string | null;
    }>;
    resolve(input: {
        disputeId: string;
        adminId: string;
        role: UserRole;
        status: DisputeStatus;
        resolution?: string;
        processEscrowRefund?: boolean;
    }): Promise<{
        category: import(".prisma/client").$Enums.DisputeCategory;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
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
        description: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DisputeStatus;
        projectId: string;
        resolution: string | null;
        resolvedAt: Date | null;
        openedById: string;
    }>;
    private refundProjectEscrow;
    private assertDisputeAccess;
}
