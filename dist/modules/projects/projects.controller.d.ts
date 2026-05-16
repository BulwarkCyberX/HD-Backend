import { type RequestUser } from '../../auth/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CompleteProjectDto } from './dto/complete-project.dto';
export declare class ProjectsController {
    private readonly projects;
    constructor(projects: ProjectsService);
    create(user: RequestUser, dto: CreateProjectDto): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: number;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        selectedProvider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }>;
    listAll(): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: number;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        selectedProvider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }[]>;
    getById(id: string): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: number;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        selectedProvider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }>;
    complete(user: RequestUser, id: string, dto: CompleteProjectDto): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: number;
            currency: import(".prisma/client").$Enums.PaymentCurrency;
        } | null;
        review: {
            id: string;
            createdAt: Date;
            rating: number;
            clientId: string;
            providerId: string;
            comment: string | null;
        } | null;
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        assets: import("@prisma/client/runtime/library").JsonValue;
        inScope: string[];
        outOfScope: string[];
        testingWindow: string;
        budgetType: import(".prisma/client").$Enums.BudgetType;
        budgetAmount: number;
        timeline: string;
        visibility: import(".prisma/client").$Enums.ProjectVisibility;
        status: import(".prisma/client").$Enums.ProjectStatus;
        selectedProvider: {
            providerProfile: {
                rating: number;
                totalReviews: number;
                completedProjects: number;
                validReportCount: number;
                reputationScore: number;
            } | null;
            email: string;
            id: string;
        } | null;
        clientId: string;
        selectedProviderId: string | null;
    }>;
}
