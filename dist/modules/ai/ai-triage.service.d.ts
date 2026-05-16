import { ReportSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
export type ReportAiTriageHints = {
    suggestedSeverity: ReportSeverity | null;
    submittedSeverity: ReportSeverity;
    severityMatch: boolean;
    rationale: string;
    completeness: string;
    missingFields: string[];
    checklist: string[];
    duplicate: {
        likelyDuplicate: boolean;
        score: number;
        comparedReportId?: string;
        rationale?: string;
    } | null;
    generatedAt: string;
};
export declare class AiTriageService {
    private readonly prisma;
    private readonly ai;
    private readonly logger;
    constructor(prisma: PrismaService, ai: AiService);
    runForReport(reportId: string, actorUserId: string): Promise<ReportAiTriageHints | null>;
    private buildHints;
    private findDuplicateHint;
    private mapSeverityLabel;
}
