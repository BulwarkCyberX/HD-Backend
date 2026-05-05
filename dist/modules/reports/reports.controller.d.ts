import { type RequestUser } from '../../auth/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';
import { TriageReportDto } from './dto/triage-report.dto';
export declare class ReportsController {
    private readonly reports;
    constructor(reports: ReportsService);
    create(user: RequestUser, dto: CreateReportDto): Promise<{
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
    listAllForAdmin(user: RequestUser): Promise<{
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
    listByProject(user: RequestUser, projectId: string): Promise<{
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
    triage(user: RequestUser, id: string, dto: TriageReportDto): Promise<{
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
