import { type RequestUser } from '../../auth/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { LinkProjectDto } from './dto/link-project.dto';
export declare class OrganizationsController {
    private readonly orgs;
    constructor(orgs: OrganizationsService);
    create(user: RequestUser, dto: CreateOrganizationDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        slug: string;
    }>;
    listMine(user: RequestUser): Promise<{
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
    getById(user: RequestUser, id: string): Promise<{
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
    addMember(user: RequestUser, id: string, dto: AddMemberDto): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrganizationMemberRole;
    }>;
    listLinkable(user: RequestUser, id: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        budgetAmount: number;
        status: import(".prisma/client").$Enums.ProjectStatus;
    }[]>;
    linkProject(user: RequestUser, id: string, dto: LinkProjectDto): Promise<{
        organizationId: string;
        projectId: string;
    }>;
    unlinkProject(user: RequestUser, id: string, projectId: string): Promise<{
        ok: true;
    }>;
}
