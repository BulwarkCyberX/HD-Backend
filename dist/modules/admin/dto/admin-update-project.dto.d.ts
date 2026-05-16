import { BudgetType, ProjectStatus, ProjectVisibility } from '@prisma/client';
export declare class AdminUpdateProjectDto {
    title?: string;
    description?: string;
    status?: ProjectStatus;
    visibility?: ProjectVisibility;
    budgetType?: BudgetType;
    budgetAmount?: number;
    timeline?: string;
    testingWindow?: string;
    inScope?: string[];
    outOfScope?: string[];
    selectedProviderId?: string | null;
}
