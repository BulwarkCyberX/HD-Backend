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
        slug: string;
        members: {
            role: import(".prisma/client").$Enums.OrganizationMemberRole;
        }[];
    }[]>;
    addMember(input: {
        orgId: string;
        requesterId: string;
        email: string;
        role: OrganizationMemberRole;
    }): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.OrganizationMemberRole;
        userId: string;
    }>;
    private assertAdminOrOwner;
}
