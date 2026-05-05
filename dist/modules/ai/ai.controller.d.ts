import { AiService } from './ai.service';
import { AiScopeDto } from './dto/scope.dto';
import { AiProposalDto } from './dto/proposal.dto';
import { AiReportReviewDto } from './dto/report-review.dto';
export declare class AiController {
    private readonly ai;
    constructor(ai: AiService);
    scope(dto: AiScopeDto): {
        suggestionsOnly: boolean;
        assets: {
            type: string;
            value: string;
        }[];
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        notes: string;
    };
    proposal(dto: AiProposalDto): {
        suggestionsOnly: boolean;
        improved: string;
        hints: string[];
    };
    reportReview(dto: AiReportReviewDto): {
        suggestionsOnly: boolean;
        completeness: string;
        missingFields: string[];
        checklist: string[];
    };
}
