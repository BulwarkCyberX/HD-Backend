import { ReportSeverity } from '@prisma/client';
export declare class AiService {
    suggestScope(description: string): {
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
    improveProposal(proposal: string): {
        suggestionsOnly: boolean;
        improved: string;
        hints: string[];
    };
    reviewReport(input: {
        title: string;
        description: string;
        severity: ReportSeverity;
    }): {
        suggestionsOnly: boolean;
        completeness: string;
        missingFields: string[];
        checklist: string[];
    };
}
