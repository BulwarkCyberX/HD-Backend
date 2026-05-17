import { ReportSeverity } from '@prisma/client';
export declare class V1CreateReportDto {
    title: string;
    description: string;
    severity: ReportSeverity;
}
