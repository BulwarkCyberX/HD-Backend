import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMe(userId: string): Promise<{
        emailVerified: boolean;
        entity: {
            id: string;
            createdAt: Date;
            name: string;
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
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        entityId: string | null;
        createdAt: Date;
    }>;
    getById(requester: {
        userId: string;
        role: UserRole;
    }, id: string): Promise<{
        entity: {
            id: string;
            createdAt: Date;
            name: string;
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
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        entityId: string | null;
        createdAt: Date;
    }>;
    getProviderProfile(id: string): Promise<{
        providerProfile: {
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bidCredits: number;
        } | null;
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
}
