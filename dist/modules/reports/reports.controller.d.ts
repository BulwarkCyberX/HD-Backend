import { type RequestUser } from '../../auth/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';
import { TriageReportDto } from './dto/triage-report.dto';
export declare class ReportsController {
    private readonly reports;
    constructor(reports: ReportsService);
    create(user: RequestUser, dto: CreateReportDto): Promise<{
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
    listAllForAdmin(user: RequestUser): Promise<{
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
    listByProject(user: RequestUser, projectId: string): Promise<{
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
    triage(user: RequestUser, id: string, dto: TriageReportDto): Promise<{
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
