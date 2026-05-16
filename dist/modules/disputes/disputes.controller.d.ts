import { type RequestUser } from '../../auth/current-user.decorator';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputeCommentDto } from './dto/dispute-comment.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
export declare class DisputesController {
    private readonly disputes;
    constructor(disputes: DisputesService);
    create(user: RequestUser, dto: CreateDisputeDto): Promise<{
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
    listForProject(user: RequestUser, projectId: string): Promise<{
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
    listAdmin(user: RequestUser): Promise<{
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
    markReview(user: RequestUser, id: string): Promise<{
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
    resolve(user: RequestUser, id: string, dto: ResolveDisputeDto): Promise<{
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
