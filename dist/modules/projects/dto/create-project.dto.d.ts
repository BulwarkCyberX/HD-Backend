import { BudgetType, ProjectVisibility } from '@prisma/client';
export declare class ProjectAssetDto {
    type: 'DOMAIN' | 'URL' | 'IP';
    value: string;
}
export declare class CreateProjectDto {
    title: string;
    description: string;
    assets: ProjectAssetDto[];
    inScope: string[];
    outOfScope: string[];
    testingWindow: string;
    budgetType: BudgetType;
    budgetAmount: number;
    timeline: string;
    visibility: ProjectVisibility;
}
