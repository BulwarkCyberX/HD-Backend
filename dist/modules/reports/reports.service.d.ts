import { UserRole, type ReportSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ReportsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private readonly reportSelect;
    private assertProjectParticipant;
    create(input: {
        projectId: string;
        submittedBy: string;
        title: string;
        description: string;
        severity: ReportSeverity;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        status: import(".prisma/client").$Enums.ReportStatus;
        triageNotes: string | null;
        createdAt: Date;
        project: {
            id: string;
            title: string;
            clientId: string;
            selectedProviderId: string | null;
        };
        submitter: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        validator: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        } | null;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        submittedBy: string;
        validatedBy: string | null;
    }>;
    listByProject(input: {
        projectId: string;
        requesterId: string;
        requesterRole: UserRole;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        status: import(".prisma/client").$Enums.ReportStatus;
        triageNotes: string | null;
        createdAt: Date;
        project: {
            id: string;
            title: string;
            clientId: string;
            selectedProviderId: string | null;
        };
        submitter: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        validator: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        } | null;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        submittedBy: string;
        validatedBy: string | null;
    }[]>;
    listAllForAdmin(input: {
        requesterRole: UserRole;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        status: import(".prisma/client").$Enums.ReportStatus;
        triageNotes: string | null;
        createdAt: Date;
        project: {
            id: string;
            title: string;
            clientId: string;
            selectedProviderId: string | null;
        };
        submitter: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        validator: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        } | null;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
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
        id: string;
        title: string;
        description: string;
        severity: import(".prisma/client").$Enums.ReportSeverity;
        status: import(".prisma/client").$Enums.ReportStatus;
        triageNotes: string | null;
        createdAt: Date;
        project: {
            id: string;
            title: string;
            clientId: string;
            selectedProviderId: string | null;
        };
        submitter: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        validator: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        } | null;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        projectId: string;
        submittedBy: string;
        validatedBy: string | null;
    }>;
}
