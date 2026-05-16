import { PrismaService } from '../../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    providerFor(userId: string): Promise<{
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
    clientFor(userId: string): Promise<{
        projectsOwned: number;
        wallet: {
            availableBalance: string;
            escrowBalance: string;
            totalSpent: string;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
    }>;
}
