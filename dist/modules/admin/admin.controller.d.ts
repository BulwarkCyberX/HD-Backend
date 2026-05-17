import { ProjectStatus, ProjectVisibility } from '@prisma/client';
import { type RequestUser } from '../../auth/current-user.decorator';
import { EmailTemplateService } from '../email/email-template.service';
import { AdminProjectsService } from './admin-projects.service';
import { BidsService } from '../bids/bids.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { FraudService } from '../trust/fraud.service';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { AdminUpdateProjectDto } from './dto/admin-update-project.dto';
export declare class AdminController {
    private readonly emailTemplates;
    private readonly adminProjects;
    private readonly bids;
    private readonly analytics;
    private readonly fraud;
    constructor(emailTemplates: EmailTemplateService, adminProjects: AdminProjectsService, bids: BidsService, analytics: AnalyticsService, fraud: FraudService);
    overview(): {
        sections: {
            id: string;
            label: string;
            href: string;
        }[];
    };
    analyticsSummary(): Promise<{
        users: number;
        projects: number;
        releasedPaymentsGross: number;
        activeDisputes: number;
        pendingKyc: number;
        pendingWithdrawals: number;
        projectsByStatus: {
            status: import(".prisma/client").$Enums.ProjectStatus;
            count: number;
        }[];
        platformWallet: {
            availableBalance: string;
            lifetimeEarnings: string;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
    }>;
    listFraudFlags(): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        id: string;
        updatedAt: Date;
        userId: string;
        score: number;
        reasons: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    clearFraudFlag(user: RequestUser, userId: string): Promise<{
        ok: boolean;
    }>;
    listEmailTemplates(): Promise<{
        name: string;
        subject: string;
        category: string;
        id: string;
        key: string;
        description: string;
        title: string;
        preheader: string | null;
        variables: string[];
        updatedAt: Date;
    }[]>;
    sampleVariables(key: string): Record<string, string>;
    getEmailTemplate(key: string): Promise<{
        name: string;
        subject: string;
        category: string;
        id: string;
        key: string;
        description: string;
        title: string;
        preheader: string | null;
        innerHtml: string;
        textBody: string;
        variables: string[];
        updatedById: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateEmailTemplate(user: RequestUser, key: string, dto: UpdateEmailTemplateDto): Promise<{
        name: string;
        subject: string;
        category: string;
        id: string;
        key: string;
        description: string;
        title: string;
        preheader: string | null;
        innerHtml: string;
        textBody: string;
        variables: string[];
        updatedById: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    previewEmailTemplate(key: string, body?: {
        variables?: Record<string, string>;
    }): Promise<{
        subject: string;
        html: string;
        text: string;
    }>;
    listProjects(status?: ProjectStatus, visibility?: ProjectVisibility, q?: string): Promise<{
        payment: {
            amount: number;
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        _count: {
            bids: number;
            reports: number;
            milestones: number;
            disputes: number;
        };
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        client: {
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
        };
        selectedProvider: {
            providerProfile: {
                rating: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }[]>;
    getProject(id: string): Promise<{
        payment: {
            amount: number;
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        bids: {
            id: string;
            createdAt: Date;
            provider: {
                email: string;
                id: string;
            };
            timeline: string;
            status: import(".prisma/client").$Enums.BidStatus;
            proposal: string;
            price: number;
        }[];
        _count: {
            bids: number;
            reports: number;
            milestones: number;
            disputes: number;
        };
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        client: {
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
        };
        selectedProvider: {
            providerProfile: {
                rating: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        milestones: {
            amount: import("@prisma/client/runtime/library").Decimal;
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.MilestoneStatus;
            sortOrder: number;
        }[];
        disputes: {
            category: import(".prisma/client").$Enums.DisputeCategory;
            id: string;
            title: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DisputeStatus;
        }[];
        clientId: string;
        selectedProviderId: string | null;
    }>;
    updateProject(id: string, dto: AdminUpdateProjectDto): Promise<{
        payment: {
            amount: number;
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        _count: {
            bids: number;
            reports: number;
            milestones: number;
            disputes: number;
        };
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        client: {
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
        };
        selectedProvider: {
            providerProfile: {
                rating: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }>;
    acceptBid(bidId: string): Promise<{
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
    projectFinancials(id: string): Promise<{
        payment: {
            amount: number;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            projectId: string;
            payerId: string;
            payeeId: string;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        checkouts: {
            amount: number;
            id: string;
            createdAt: Date;
            provider: import(".prisma/client").$Enums.PspProviderName;
            status: import(".prisma/client").$Enums.PspCheckoutStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
            providerOrderId: string | null;
            providerPaymentId: string | null;
            paidAt: Date | null;
        }[];
        ledger: {
            amount: import("@prisma/client/runtime/library").Decimal;
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.LedgerEntryType;
            status: import(".prisma/client").$Enums.LedgerEntryStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
            referenceId: string;
        }[];
        clientWallet: {
            escrowBalance: string;
            availableBalance: string;
            totalSpent: string;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
    }>;
}
