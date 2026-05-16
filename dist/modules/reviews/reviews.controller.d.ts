import { type RequestUser } from '../../auth/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviews;
    constructor(reviews: ReviewsService);
    create(user: RequestUser, dto: CreateReviewDto): Promise<{
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
    createClientReview(user: RequestUser, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        rating: number;
        clientId: string;
        projectId: string;
        providerId: string;
        comment: string | null;
    }>;
}
