import { ReportSeverity, WebhookEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
export declare class IntegrationsService {
    private readonly prisma;
    private readonly webhooks;
    private readonly reports;
    constructor(prisma: PrismaService, webhooks: WebhookDispatcherService, reports: ReportsService);
    listApiKeys(userId: string): Promise<{
        id: string;
        createdAt: Date;
        lastUsedAt: Date | null;
        label: string;
        keyPrefix: string;
        scopes: string[];
    }[]>;
    createApiKey(userId: string, label: string, scopes?: string[]): Promise<{
        apiKey: string;
        keyPrefix: string;
        label: string;
        scopes: ("read" | "write:reports")[];
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
    sendWebhookTest(userId: string, endpointId: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    retryDelivery(userId: string, deliveryId: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    getDeliveryForRetry(userId: string, deliveryId: string): Promise<{
        id: string;
        event: import(".prisma/client").$Enums.WebhookEventType;
        payload: import("@prisma/client/runtime/library").JsonValue;
        success: boolean;
        endpointId: string;
    }>;
    createReportForApiUser(userId: string, projectId: string, body: {
        title: string;
        description: string;
        severity: ReportSeverity;
    }): Promise<{
        project: {
            id: string;
            title: string;
            clientId: string;
            selectedProviderId: string | null;
        };
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ReportStatus;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        submittedBy: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        triageNotes: string | null;
        aiTriageHints: import("@prisma/client/runtime/library").JsonValue;
        validatedBy: string | null;
        submitter: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        validator: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        } | null;
    }>;
    setWebhookEnabled(userId: string, id: string, enabled: boolean): Promise<{
        id: string;
        label: string;
        enabled: boolean;
    }>;
}
