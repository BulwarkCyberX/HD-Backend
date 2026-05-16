import { type RequestUser } from '../../auth/current-user.decorator';
import { BountyService } from './bounty.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { UpdateBugReportStatusDto } from './dto/update-bug-report-status.dto';
export declare class BountyController {
    private readonly bounty;
    constructor(bounty: BountyService);
    createProgram(user: RequestUser, dto: CreateProgramDto): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        status: import(".prisma/client").$Enums.BugBountyProgramStatus;
        clientId: string;
        rewardTable: import("@prisma/client/runtime/library").JsonValue;
        allowedResearcherIds: string[];
    }>;
    listPrograms(user: RequestUser): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        status: import(".prisma/client").$Enums.BugBountyProgramStatus;
        clientId: string;
        rewardTable: import("@prisma/client/runtime/library").JsonValue;
        allowedResearcherIds: string[];
    }[]>;
    getProgram(user: RequestUser, id: string): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        scope: import("@prisma/client/runtime/library").JsonValue;
        status: import(".prisma/client").$Enums.BugBountyProgramStatus;
        clientId: string;
        rewardTable: import("@prisma/client/runtime/library").JsonValue;
        allowedResearcherIds: string[];
    }>;
    submitReport(user: RequestUser, dto: CreateBugReportDto): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
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
    listReports(user: RequestUser, programId: string): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
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
    updateReportStatus(user: RequestUser, id: string, dto: UpdateBugReportStatusDto): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
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
}
