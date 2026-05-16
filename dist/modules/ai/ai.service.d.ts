import { ConfigService } from '@nestjs/config';
import { ReportSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type Redis from 'ioredis';
export declare class AiService {
    private readonly config;
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly client;
    constructor(config: ConfigService, prisma: PrismaService, redis: Redis | undefined);
    private rateLimit;
    private logUsage;
    private completeJson;
    suggestScope(description: string, userId: string): Promise<{
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
    improveProposal(proposal: string, userId: string): Promise<{
        suggestionsOnly: boolean;
        improved: string;
        hints: string[];
    } | {
        suggestionsOnly: boolean;
    }>;
    reviewReport(input: {
        title: string;
        description: string;
        severity: ReportSeverity;
    }, userId: string): Promise<{
        suggestionsOnly: boolean;
        completeness: string;
        missingFields: string[];
        checklist: string[];
    } | {
        suggestionsOnly: boolean;
    }>;
    classifyRisk(input: {
        title: string;
        description: string;
    }, userId: string): Promise<Record<string, unknown> | {
        label: import(".prisma/client").$Enums.ReportSeverity;
        rationale: string;
    }>;
    duplicateHint(a: string, b: string, userId: string): Promise<Record<string, unknown>>;
    private mockScope;
    private mockProposal;
    private mockRiskClassification;
    private mockReview;
}
