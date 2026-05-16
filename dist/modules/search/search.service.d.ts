import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class SearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchProjects(input: {
        q: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        clientId: string;
    }[]>;
    searchProviders(input: {
        q: string;
    }): Promise<{
        providerProfile: {
            skills: string[];
            rating: number;
            completedProjects: number;
            reputationScore: number;
        } | null;
        email: string;
        id: string;
    }[]>;
    listSavedSearches(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        queryJson: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    createSavedSearch(userId: string, name: string, queryJson: object): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        queryJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
    trendingProjects(): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        budgetAmount: number;
        status: import(".prisma/client").$Enums.ProjectStatus;
    }[]>;
}
