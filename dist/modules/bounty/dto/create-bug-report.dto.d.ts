import { ReportSeverity } from '@prisma/client';
export declare class CreateBugReportDto {
    programId: string;
    title: string;
    description: string;
    severity: ReportSeverity;
}
