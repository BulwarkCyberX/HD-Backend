import { OrganizationMemberRole, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class OrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: {
        ownerId: string;
        role: UserRole;
        name: string;
        slug: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
    }>;
    listMine(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        _count: {
            projects: number;
            members: number;
        };
        slug: string;
        members: {
            role: import(".prisma/client").$Enums.OrganizationMemberRole;
        }[];
    }[]>;
    getById(orgId: string, requesterId: string): Promise<{
        projects: {
            id: string;
            title: string;
            createdAt: Date;
            budgetAmount: number;
            status: import(".prisma/client").$Enums.ProjectStatus;
        }[];
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
        members: {
            user: {
                email: string;
                firstName: string | null;
                id: string;
                lastName: string | null;
            };
            id: string;
            createdAt: Date;
            role: import(".prisma/client").$Enums.OrganizationMemberRole;
        }[];
    }>;
    addMember(input: {
        orgId: string;
        requesterId: string;
        email: string;
        role: OrganizationMemberRole;
    }): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrganizationMemberRole;
    }>;
    linkProject(input: {
        orgId: string;
        projectId: string;
        requesterId: string;
    }): Promise<{
        organizationId: string;
        projectId: string;
    }>;
    unlinkProject(input: {
        orgId: string;
        projectId: string;
        requesterId: string;
    }): Promise<{
        ok: true;
    }>;
    listLinkableProjects(orgId: string, requesterId: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        budgetAmount: number;
        status: import(".prisma/client").$Enums.ProjectStatus;
    }[]>;
    private assertMember;
    private assertAdminOrOwner;
}
