import { type RequestUser } from '../../auth/current-user.decorator';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidStatusDto } from './dto/update-bid-status.dto';
export declare class BidsController {
    private readonly bids;
    constructor(bids: BidsService);
    create(user: RequestUser, dto: CreateBidDto): Promise<{
        id: string;
        createdAt: Date;
        provider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
                bidCredits: number;
            } | null;
            email: string;
            id: string;
        };
        timeline: string;
        status: import(".prisma/client").$Enums.BidStatus;
        projectId: string;
        providerId: string;
        proposal: string;
        price: number;
    }>;
    listForProject(user: RequestUser, projectId: string): Promise<{
        id: string;
        createdAt: Date;
        provider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
                bidCredits: number;
            } | null;
            email: string;
            id: string;
        };
        timeline: string;
        status: import(".prisma/client").$Enums.BidStatus;
        projectId: string;
        providerId: string;
        proposal: string;
        price: number;
    }[]>;
    listMine(user: RequestUser): Promise<{
        project: {
            id: string;
            title: string;
            visibility: import(".prisma/client").$Enums.ProjectVisibility;
            status: import(".prisma/client").$Enums.ProjectStatus;
        };
        id: string;
        createdAt: Date;
        provider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
                bidCredits: number;
            } | null;
            email: string;
            id: string;
        };
        timeline: string;
        status: import(".prisma/client").$Enums.BidStatus;
        projectId: string;
        providerId: string;
        proposal: string;
        price: number;
    }[]>;
    updateStatus(user: RequestUser, id: string, dto: UpdateBidStatusDto): Promise<{
        id: string;
        createdAt: Date;
        provider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
                bidCredits: number;
            } | null;
            email: string;
            id: string;
        };
        timeline: string;
        status: import(".prisma/client").$Enums.BidStatus;
        projectId: string;
        providerId: string;
        proposal: string;
        price: number;
    }>;
}
