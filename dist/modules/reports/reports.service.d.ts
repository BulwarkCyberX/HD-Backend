import { UserRole, type ReportSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DomainEventsService } from '../realtime/domain-events.service';
export declare class ReportsService {
    private readonly prisma;
    private readonly notifications;
    private readonly events;
    constructor(prisma: PrismaService, notifications: NotificationsService, events: DomainEventsService);
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
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        triageNotes: string | null;
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
        submittedBy: string;
        validatedBy: string | null;
    }>;
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
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        triageNotes: string | null;
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
        submittedBy: string;
        validatedBy: string | null;
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
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        triageNotes: string | null;
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
        submittedBy: string;
        validatedBy: string | null;
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
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        triageNotes: string | null;
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
        submittedBy: string;
        validatedBy: string | null;
    }>;
}
