import { SearchService } from './search.service';
export declare class SearchPublicController {
    private readonly search;
    constructor(search: SearchService);
    projects(q?: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        budgetAmount: number;
        status: import(".prisma/client").$Enums.ProjectStatus;
    }[]>;
    providers(q?: string): Promise<{
        providerProfile: {
            skills: string[];
            rating: number;
            completedProjects: number;
            reputationScore: number;
        } | null;
        email: string;
        id: string;
    }[]>;
    trendingProjects(): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        budgetAmount: number;
        status: import(".prisma/client").$Enums.ProjectStatus;
    }[]>;
}
