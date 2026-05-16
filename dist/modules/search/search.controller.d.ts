import { type RequestUser } from '../../auth/current-user.decorator';
import { SearchService } from './search.service';
import { CreateSavedSearchDto } from './dto/saved-search.dto';
export declare class SearchController {
    private readonly search;
    constructor(search: SearchService);
    projects(user: RequestUser, q?: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        clientId: string;
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
    savedMine(user: RequestUser): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        queryJson: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    saveSearch(user: RequestUser, dto: CreateSavedSearchDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        queryJson: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
