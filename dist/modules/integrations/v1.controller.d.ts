import { IntegrationsService } from './integrations.service';
import { V1CreateReportDto } from './dto/v1-create-report.dto';
type ApiRequest = {
    apiUser?: {
        userId: string;
        scopes: string[];
    };
};
export declare class V1Controller {
    private readonly integrations;
    constructor(integrations: IntegrationsService);
    private userId;
    listProjects(req: ApiRequest, cursor?: string, limit?: string): Promise<{
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
    getProject(req: ApiRequest, id: string): Promise<{
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
    listReports(req: ApiRequest, id: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ReportStatus;
        severity: import(".prisma/client").$Enums.ReportSeverity;
    }[]>;
    listMilestones(req: ApiRequest, id: string): Promise<{
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        title: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.MilestoneStatus;
        currency: import(".prisma/client").$Enums.PaymentCurrency;
        releasedAt: Date | null;
    }[]>;
    createReport(req: ApiRequest, id: string, dto: V1CreateReportDto): Promise<{
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
}
export {};
