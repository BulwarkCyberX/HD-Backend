import { type RequestUser } from '../../auth/current-user.decorator';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputeCommentDto } from './dto/dispute-comment.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { AddDisputeEvidenceDto } from './dto/add-dispute-evidence.dto';
export declare class DisputesController {
    private readonly disputes;
    constructor(disputes: DisputesService);
    create(user: RequestUser, dto: CreateDisputeDto): Promise<{
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
    listForProject(user: RequestUser, projectId: string): Promise<{
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
    listAdmin(user: RequestUser): Promise<{
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
    getById(user: RequestUser, id: string): Promise<{
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
    markReview(user: RequestUser, id: string): Promise<{
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
    resolve(user: RequestUser, id: string, dto: ResolveDisputeDto): Promise<{
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
    addEvidence(user: RequestUser, id: string, dto: AddDisputeEvidenceDto): Promise<{
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
    addComment(user: RequestUser, id: string, dto: DisputeCommentDto): Promise<{
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
}
