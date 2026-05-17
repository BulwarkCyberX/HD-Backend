import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import type { UpsertOrgSsoDto } from './dto/upsert-org-sso.dto';
export declare class EnterpriseSsoService {
    private readonly prisma;
    private readonly jwt;
    private readonly auth;
    constructor(prisma: PrismaService, jwt: JwtService, auth: AuthService);
    private apiOrigin;
    private webOrigin;
    getPublicStatus(slug: string): Promise<{
        enabled: false;
        organizationName?: undefined;
        protocol?: undefined;
        loginUrl?: undefined;
    } | {
        enabled: true;
        organizationName: string;
        protocol: import(".prisma/client").$Enums.EnterpriseSsoProtocol;
        loginUrl: string;
    }>;
    getConfigForMember(orgId: string, requesterId: string): Promise<{
        id: string;
        updatedAt: Date;
        enabled: boolean;
        clientId: string;
        protocol: import(".prisma/client").$Enums.EnterpriseSsoProtocol;
        issuerUrl: string;
        allowedEmailDomains: string[];
    } | null>;
    upsertConfig(orgId: string, requesterId: string, dto: UpsertOrgSsoDto): Promise<{
        id: string;
        updatedAt: Date;
        enabled: boolean;
        clientId: string;
        protocol: import(".prisma/client").$Enums.EnterpriseSsoProtocol;
        issuerUrl: string;
        allowedEmailDomains: string[];
    }>;
    deleteConfig(orgId: string, requesterId: string): Promise<{
        ok: boolean;
    }>;
    startLogin(slug: string, next?: string): Promise<string>;
    handleCallback(slug: string, code: string, state: string): Promise<string>;
    private discoverOidc;
    private resolveEmailFromOidc;
    private assertEmailDomain;
    private ensureOrgMembership;
    private assertOrgManager;
    private assertOrgOwner;
}
