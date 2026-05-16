import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TransactionalEmailService } from '../email/transactional-email.service';
import { DomainEventsService } from '../realtime/domain-events.service';
export declare class BidsService {
    private readonly prisma;
    private readonly notifications;
    private readonly transactional;
    private readonly events;
    constructor(prisma: PrismaService, notifications: NotificationsService, transactional: TransactionalEmailService, events: DomainEventsService);
    private readonly bidSelect;
    create(input: {
        providerId: string;
        role: UserRole;
        projectId: string;
        proposal: string;
        price: number;
        timeline: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        provider: {
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
        };
        timeline: string;
        status: import(".prisma/client").$Enums.BidStatus;
        projectId: string;
        providerId: string;
        proposal: string;
        price: number;
    }>;
    listForProject(input: {
        requesterId: string;
        role: UserRole;
        projectId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        provider: {
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
        };
        timeline: string;
        status: import(".prisma/client").$Enums.BidStatus;
        projectId: string;
        providerId: string;
        proposal: string;
        price: number;
    }[]>;
    listMine(input: {
        requesterId: string;
        role: UserRole;
    }): Promise<{
        project: {
            id: string;
            title: string;
            visibility: import(".prisma/client").$Enums.ProjectVisibility;
            status: import(".prisma/client").$Enums.ProjectStatus;
        };
        id: string;
        createdAt: Date;
        provider: {
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
        };
        timeline: string;
        status: import(".prisma/client").$Enums.BidStatus;
        projectId: string;
        providerId: string;
        proposal: string;
        price: number;
    }[]>;
    updateStatus(input: {
        requesterId: string;
        role: UserRole;
        bidId: string;
        status: 'ACCEPTED' | 'REJECTED';
    }): Promise<{
        id: string;
        createdAt: Date;
        provider: {
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
        };
        timeline: string;
        status: import(".prisma/client").$Enums.BidStatus;
        projectId: string;
        providerId: string;
        proposal: string;
        price: number;
    }>;
}
