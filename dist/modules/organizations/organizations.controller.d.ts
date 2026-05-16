import { type RequestUser } from '../../auth/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
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
        slug: string;
        members: {
            role: import(".prisma/client").$Enums.OrganizationMemberRole;
        }[];
    }[]>;
    addMember(user: RequestUser, id: string, dto: AddMemberDto): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.OrganizationMemberRole;
        userId: string;
    }>;
}
