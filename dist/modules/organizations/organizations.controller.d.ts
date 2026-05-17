import { type RequestUser } from '../../auth/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { LinkProjectDto } from './dto/link-project.dto';
import { EnterpriseSsoService } from '../enterprise-sso/enterprise-sso.service';
import { UpsertOrgSsoDto } from '../enterprise-sso/dto/upsert-org-sso.dto';
export declare class OrganizationsController {
    private readonly orgs;
    private readonly sso;
    constructor(orgs: OrganizationsService, sso: EnterpriseSsoService);
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
    getSso(user: RequestUser, id: string): Promise<{
        id: string;
        updatedAt: Date;
        enabled: boolean;
        clientId: string;
        protocol: import(".prisma/client").$Enums.EnterpriseSsoProtocol;
        issuerUrl: string;
        allowedEmailDomains: string[];
    } | null>;
    upsertSso(user: RequestUser, id: string, dto: UpsertOrgSsoDto): Promise<{
        id: string;
        updatedAt: Date;
        enabled: boolean;
        clientId: string;
        protocol: import(".prisma/client").$Enums.EnterpriseSsoProtocol;
        issuerUrl: string;
        allowedEmailDomains: string[];
    }>;
    deleteSso(user: RequestUser, id: string): Promise<{
        ok: boolean;
    }>;
}
