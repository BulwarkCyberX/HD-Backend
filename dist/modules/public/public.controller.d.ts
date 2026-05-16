import { PublicService } from './public.service';
export declare class PublicController {
    private readonly pub;
    constructor(pub: PublicService);
    listProjects(q?: string, minBudget?: string, maxBudget?: string, budgetType?: string, skill?: string, sort?: 'newest' | 'budget_asc' | 'budget_desc'): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        projectSkills: {
            skill: {
                label: string;
                slug: string;
            };
        }[];
    }[]>;
    getProject(id: string): Promise<{
        id: string;
        description: string;
        title: string;
        createdAt: Date;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        projectSkills: {
            skill: {
                label: string;
                slug: string;
            };
        }[];
    }>;
    featuredProviders(): Promise<{
        providerProfile: {
            skills: string[];
            rating: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bio: string;
            availabilityStatus: string;
        } | null;
        firstName: string | null;
        id: string;
        lastName: string | null;
    }[]>;
    getProvider(id: string): Promise<{
        id: string;
        displayName: string;
        country: string | null;
        city: string | null;
        memberSince: Date;
        profile: {
            skills: string[];
            certifications: string[];
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bio: string;
            portfolio: import("@prisma/client/runtime/library").JsonValue;
            availabilityStatus: string;
            providerSkills: {
                skill: {
                    label: string;
                    slug: string;
                };
            }[];
        };
    }>;
}
