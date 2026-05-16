import { CanActivate, ExecutionContext } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
export declare class ApiKeyGuard implements CanActivate {
    private readonly integrations;
    constructor(integrations: IntegrationsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
