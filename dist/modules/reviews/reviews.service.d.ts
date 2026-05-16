import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly reviewSelect;
    create(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        rating: number;
        comment?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        rating: number;
        provider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        };
        clientId: string;
        projectId: string;
        providerId: string;
        comment: string | null;
    }>;
    createClientReview(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
        rating: number;
        comment?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        rating: number;
        clientId: string;
        projectId: string;
        providerId: string;
        comment: string | null;
    }>;
}
