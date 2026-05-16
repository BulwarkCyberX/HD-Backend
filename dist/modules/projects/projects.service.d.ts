import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, type BudgetType, type ProjectVisibility } from '@prisma/client';
import { WebhookDispatcherService } from '../integrations/webhook-dispatcher.service';
import { TransactionalEmailService } from '../email/transactional-email.service';
export declare class ProjectsService {
    private readonly prisma;
    private readonly transactional;
    private readonly webhooks;
    constructor(prisma: PrismaService, transactional: TransactionalEmailService, webhooks: WebhookDispatcherService);
    private readonly projectSelect;
    create(input: {
        userId: string;
        role: UserRole;
        title: string;
        description: string;
        assets: Array<{
            type: 'DOMAIN' | 'URL' | 'IP';
            value: string;
        }>;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: ProjectVisibility;
    }): Promise<{
        payment: {
            amount: number;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        clientReview: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        selectedProvider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }>;
    listAll(): Promise<{
        payment: {
            amount: number;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        clientReview: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        selectedProvider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }[]>;
    getById(id: string): Promise<{
        payment: {
            amount: number;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        clientReview: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        selectedProvider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }>;
    completeProject(input: {
        projectId: string;
        requesterId: string;
        role: UserRole;
        explicitClientConfirmation: boolean;
    }): Promise<{
        payment: {
            amount: number;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        clientReview: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        selectedProvider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }>;
}
