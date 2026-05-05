import { ReportSeverity } from '@prisma/client';
export declare class VdpReportDto {
    vdpId: string;
    title: string;
    description: string;
    contactEmail?: string;
    severity?: ReportSeverity;
}
