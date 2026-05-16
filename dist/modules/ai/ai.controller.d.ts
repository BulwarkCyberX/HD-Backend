import { type RequestUser } from '../../auth/current-user.decorator';
import { AiService } from './ai.service';
import { AiScopeDto } from './dto/scope.dto';
import { AiProposalDto } from './dto/proposal.dto';
import { AiReportReviewDto } from './dto/report-review.dto';
import { AiRiskDto } from './dto/risk.dto';
import { AiDuplicateDto } from './dto/duplicate.dto';
export declare class AiController {
    private readonly ai;
    constructor(ai: AiService);
    scope(user: RequestUser, dto: AiScopeDto): Promise<{
        suggestionsOnly: boolean;
        assets: {
            type: string;
            value: string;
        }[];
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        notes: string;
    } | {
        suggestionsOnly: boolean;
    }>;
    proposal(user: RequestUser, dto: AiProposalDto): Promise<{
        suggestionsOnly: boolean;
        improved: string;
        hints: string[];
    } | {
        suggestionsOnly: boolean;
    }>;
    reportReview(user: RequestUser, dto: AiReportReviewDto): Promise<{
        suggestionsOnly: boolean;
        completeness: string;
        missingFields: string[];
        checklist: string[];
    } | {
        suggestionsOnly: boolean;
    }>;
    risk(user: RequestUser, dto: AiRiskDto): Promise<Record<string, unknown> | {
        label: import(".prisma/client").$Enums.ReportSeverity;
        rationale: string;
    }>;
    duplicate(user: RequestUser, dto: AiDuplicateDto): Promise<Record<string, unknown>>;
}
