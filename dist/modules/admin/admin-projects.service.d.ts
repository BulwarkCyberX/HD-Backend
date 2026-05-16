import { ProjectStatus, ProjectVisibility, UserRole, type BudgetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AdminProjectsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly projectSelect;
    list(input: {
        status?: ProjectStatus;
        visibility?: ProjectVisibility;
        q?: string;
    }): Promise<{
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
    getById(projectId: string): Promise<{
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
    update(projectId: string, input: {
        title?: string;
        description?: string;
        status?: ProjectStatus;
        visibility?: ProjectVisibility;
        budgetType?: BudgetType;
        budgetAmount?: number;
        timeline?: string;
        testingWindow?: string;
        inScope?: string[];
        outOfScope?: string[];
        selectedProviderId?: string | null;
    }): Promise<{
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
    getFinancials(projectId: string): Promise<{
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
    assertAdmin(role: UserRole): void;
}
