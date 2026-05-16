import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMe(userId: string): Promise<{
        emailVerified: boolean;
        settings: {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            emailDigestWeekly: boolean;
            lastEmailDigestAt: Date | null;
        } | {
            emailDigestWeekly: true;
            lastEmailDigestAt: null;
        };
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
            userId: string;
            skills: string[];
            certifications: string[];
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bidCredits: number;
            bio: string;
            portfolio: import("@prisma/client/runtime/library").JsonValue | null;
            availabilityStatus: string;
        } | null;
        clientProfile: {
            id: string;
            createdAt: Date;
            userId: string;
            rating: number;
            totalReviews: number;
            companySize: string | null;
        } | null;
        email: string;
        id: string;
        createdAt: Date;
        role: import(".prisma/client").$Enums.UserRole;
        entityId: string | null;
    }>;
    updateSettings(userId: string, input: {
        emailDigestWeekly?: boolean;
    }): Promise<{
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        emailDigestWeekly: boolean;
        lastEmailDigestAt: Date | null;
    }>;
    getById(requester: {
        userId: string;
        role: UserRole;
    }, id: string): Promise<{
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
            userId: string;
            skills: string[];
            certifications: string[];
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bidCredits: number;
            bio: string;
            portfolio: import("@prisma/client/runtime/library").JsonValue | null;
            availabilityStatus: string;
        } | null;
        clientProfile: {
            id: string;
            createdAt: Date;
            userId: string;
            rating: number;
            totalReviews: number;
            companySize: string | null;
        } | null;
        email: string;
        id: string;
        createdAt: Date;
        role: import(".prisma/client").$Enums.UserRole;
        entityId: string | null;
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
        email: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    updateProviderProfile(userId: string, role: UserRole, input: {
        bio?: string;
        portfolio?: unknown;
        availabilityStatus?: string;
        skills?: string[];
        certifications?: string[];
    }): Promise<{
        emailVerified: boolean;
        settings: {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            emailDigestWeekly: boolean;
            lastEmailDigestAt: Date | null;
        } | {
            emailDigestWeekly: true;
            lastEmailDigestAt: null;
        };
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
            userId: string;
            skills: string[];
            certifications: string[];
            rating: number;
            totalReviews: number;
            completedProjects: number;
            validReportCount: number;
            reputationScore: number;
            bidCredits: number;
            bio: string;
            portfolio: import("@prisma/client/runtime/library").JsonValue | null;
            availabilityStatus: string;
        } | null;
        clientProfile: {
            id: string;
            createdAt: Date;
            userId: string;
            rating: number;
            totalReviews: number;
            companySize: string | null;
        } | null;
        email: string;
        id: string;
        createdAt: Date;
        role: import(".prisma/client").$Enums.UserRole;
        entityId: string | null;
    }>;
}
