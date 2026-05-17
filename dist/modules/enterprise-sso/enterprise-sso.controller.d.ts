import type { Response } from 'express';
import { EnterpriseSsoService } from './enterprise-sso.service';
export declare class EnterpriseSsoController {
    private readonly sso;
    constructor(sso: EnterpriseSsoService);
    publicStatus(slug: string): Promise<{
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
    startLogin(slug: string, next: string | undefined, res: Response): Promise<void>;
    callback(slug: string, code: string, state: string, res: Response): Promise<void>;
}
