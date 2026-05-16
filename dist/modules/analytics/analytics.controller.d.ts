import { type RequestUser } from '../../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    adminSummary(): Promise<{
        users: number;
        projects: number;
        releasedPaymentsGross: number;
        activeDisputes: number;
        platformWallet: {
            availableBalance: string;
            lifetimeEarnings: string;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
    }>;
    providerMe(user: RequestUser): Promise<{
        profile: {
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
        } | null;
        bidsSubmitted: number;
        wallet: {
            availableBalance: string;
            lifetimeEarnings: string;
            escrowBalance: string;
            totalSpent: string;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
    }>;
    clientMe(user: RequestUser): Promise<{
        projectsOwned: number;
        wallet: {
            availableBalance: string;
            escrowBalance: string;
            totalSpent: string;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
    }>;
}
