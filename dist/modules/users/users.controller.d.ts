import { type RequestUser } from '../../auth/current-user.decorator';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    me(user: RequestUser): Promise<{
        emailVerified: boolean;
        entity: {
            name: string;
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.EntityType;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        } | null;
        providerProfile: {
            id: string;
            createdAt: Date;
            skills: string[];
            certifications: string[];
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bidCredits: number;
            userId: string;
        } | null;
        clientProfile: {
            id: string;
            createdAt: Date;
            companySize: string | null;
            userId: string;
        } | null;
        email: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        entityId: string | null;
        createdAt: Date;
    }>;
    providerProfile(id: string): Promise<{
        providerProfile: {
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bidCredits: number;
        } | null;
        email: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    byId(requester: RequestUser, id: string): Promise<{
        entity: {
            name: string;
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.EntityType;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        } | null;
        providerProfile: {
            id: string;
            createdAt: Date;
            skills: string[];
            certifications: string[];
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bidCredits: number;
            userId: string;
        } | null;
        clientProfile: {
            id: string;
            createdAt: Date;
            companySize: string | null;
            userId: string;
        } | null;
        email: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        entityId: string | null;
        createdAt: Date;
    }>;
}
