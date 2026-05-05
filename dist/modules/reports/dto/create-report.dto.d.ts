import { ReportSeverity } from '@prisma/client';
export declare class CreateReportDto {
    projectId: string;
    title: string;
    description: string;
    severity: ReportSeverity;
}
