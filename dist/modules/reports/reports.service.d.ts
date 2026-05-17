import { UserRole, type ReportSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DomainEventsService } from '../realtime/domain-events.service';
import { AiTriageService } from '../ai/ai-triage.service';
import { WebhookDispatcherService } from '../integrations/webhook-dispatcher.service';
import { FraudService } from '../trust/fraud.service';
export declare class ReportsService {
    private readonly prisma;
    private readonly notifications;
    private readonly events;
    private readonly aiTriage;
    private readonly webhooks;
    private readonly fraud;
    constructor(prisma: PrismaService, notifications: NotificationsService, events: DomainEventsService, aiTriage: AiTriageService, webhooks: WebhookDispatcherService, fraud: FraudService);
    private readonly reportSelect;
    private assertProjectParticipant;
    create(input: {
        projectId: string;
        submittedBy: string;
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
    runAiTriage(input: {
        reportId: string;
        requesterRole: UserRole;
        requesterId: string;
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
    } | null>;
    listByProject(input: {
        projectId: string;
        requesterId: string;
        requesterRole: UserRole;
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
    }[]>;
    listAllForAdmin(input: {
        requesterRole: UserRole;
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
    }[]>;
    triage(input: {
        reportId: string;
        requesterId: string;
        requesterRole: UserRole;
        status: 'VALID' | 'REJECTED' | 'NEED_MORE_INFO';
        triageNotes: string;
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
}
