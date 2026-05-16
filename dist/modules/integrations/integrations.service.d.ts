import { WebhookEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class IntegrationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listApiKeys(userId: string): Promise<{
        id: string;
        createdAt: Date;
        lastUsedAt: Date | null;
        label: string;
        keyPrefix: string;
        scopes: string[];
    }[]>;
    createApiKey(userId: string, label: string): Promise<{
        apiKey: string;
        keyPrefix: string;
        label: string;
        scopes: string[];
    }>;
    revokeApiKey(userId: string, keyId: string): Promise<{
        ok: boolean;
    }>;
    validateApiKey(rawKey: string): Promise<{
        id: string;
        userId: string;
        scopes: string[];
    } | null>;
    listWebhooks(userId: string): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            deliveries: number;
        };
        label: string;
        events: import(".prisma/client").$Enums.WebhookEventType[];
        enabled: boolean;
    }[]>;
    createWebhook(userId: string, input: {
        label: string;
        url: string;
        events: WebhookEventType[];
    }): Promise<{
        signingSecret: string;
        url: string;
        id: string;
        createdAt: Date;
        label: string;
        events: import(".prisma/client").$Enums.WebhookEventType[];
        enabled: boolean;
    }>;
    deleteWebhook(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
    listDeliveries(userId: string, endpointId: string): Promise<{
        id: string;
        createdAt: Date;
        event: import(".prisma/client").$Enums.WebhookEventType;
        statusCode: number | null;
        success: boolean;
        errorMessage: string | null;
    }[]>;
    listProjectsForApiUser(userId: string, cursor?: string, limit?: number): Promise<{
        items: {
            id: string;
            title: string;
            createdAt: Date;
            budgetType: import(".prisma/client").$Enums.BudgetType;
            budgetAmount: number;
            visibility: import(".prisma/client").$Enums.ProjectVisibility;
            status: import(".prisma/client").$Enums.ProjectStatus;
        }[];
        nextCursor: string | null;
    }>;
    private assertProjectAccess;
    getProjectForApiUser(userId: string, projectId: string): Promise<{
        payment: {
            amount: number;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        _count: {
            reports: number;
            milestones: number;
        };
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        clientId: string;
        selectedProviderId: string | null;
    } | null>;
    listReportsForApiUser(userId: string, projectId: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ReportStatus;
        severity: import(".prisma/client").$Enums.ReportSeverity;
    }[]>;
    listMilestonesForApiUser(userId: string, projectId: string): Promise<{
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        title: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        releasedAt: Date | null;
    }[]>;
    setWebhookEnabled(userId: string, id: string, enabled: boolean): Promise<{
        id: string;
        label: string;
        enabled: boolean;
    }>;
}
