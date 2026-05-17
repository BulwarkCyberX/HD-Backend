import { EnterpriseSsoProtocol } from '@prisma/client';
export declare class UpsertOrgSsoDto {
    protocol: EnterpriseSsoProtocol;
    enabled: boolean;
    issuerUrl: string;
    clientId: string;
    clientSecret?: string;
    allowedEmailDomains?: string[];
}
