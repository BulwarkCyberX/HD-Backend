import { type RequestUser } from '../../auth/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    me(user: RequestUser): Promise<{
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
    updateProviderProfile(user: RequestUser, dto: UpdateProviderProfileDto): Promise<{
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
    updateSettings(user: RequestUser, dto: UpdateUserSettingsDto): Promise<{
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        emailDigestWeekly: boolean;
        lastEmailDigestAt: Date | null;
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
