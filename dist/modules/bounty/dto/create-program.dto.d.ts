import { BugBountyProgramStatus } from '@prisma/client';
export declare class CreateProgramDto {
    title: string;
    description?: string;
    scope: unknown;
    rewardTable: unknown;
    status?: BugBountyProgramStatus;
    allowedResearcherIds?: string[];
}
