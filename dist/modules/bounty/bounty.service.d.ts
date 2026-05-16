import { BugBountyProgramStatus, BugReportStatus, ReportSeverity, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class BountyService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private readonly programSelect;
    private readonly bugReportSelect;
    createProgram(input: {
        clientId: string;
        role: UserRole;
        title: string;
        description: string;
        scope: unknown;
        rewardTable: unknown;
        status?: BugBountyProgramStatus;
        allowedResearcherIds?: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.BugBountyProgramStatus;
        clientId: string;
        rewardTable: import("@prisma/client/runtime/library").JsonValue;
        allowedResearcherIds: string[];
    }>;
    listPrograms(input: {
        requesterId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.BugBountyProgramStatus;
        clientId: string;
        rewardTable: import("@prisma/client/runtime/library").JsonValue;
        allowedResearcherIds: string[];
    }[]>;
    getProgram(input: {
        id: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.BugBountyProgramStatus;
        clientId: string;
        rewardTable: import("@prisma/client/runtime/library").JsonValue;
        allowedResearcherIds: string[];
    }>;
    createBugReport(input: {
        researcherId: string;
        role: UserRole;
        programId: string;
        title: string;
        description: string;
        severity: ReportSeverity;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.BugReportStatus;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        severity: import(".prisma/client").$Enums.ReportSeverity;
        researcher: {
            email: string;
            id: string;
        };
        programId: string;
        researcherId: string;
    }>;
    listReportsForProgram(input: {
        programId: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.BugReportStatus;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        severity: import(".prisma/client").$Enums.ReportSeverity;
        researcher: {
            email: string;
            id: string;
        };
        programId: string;
        researcherId: string;
    }[]>;
    updateBugReportStatus(input: {
        reportId: string;
        requesterId: string;
        role: UserRole;
        status: BugReportStatus;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        status: import(".prisma/client").$Enums.BugReportStatus;
        files: {
            id: string;
            createdAt: Date;
            originalName: string;
            mimeType: string;
            size: number;
        }[];
        severity: import(".prisma/client").$Enums.ReportSeverity;
        researcher: {
            email: string;
            id: string;
        };
        programId: string;
        researcherId: string;
    }>;
    private patchReportStatus;
}
