import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly integrations: IntegrationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['x-api-key'] as string | undefined;
    if (!header?.trim()) throw new UnauthorizedException('Missing X-API-Key header');
    const key = await this.integrations.validateApiKey(header.trim());
    if (!key) throw new UnauthorizedException('Invalid API key');
    req.apiUser = { userId: key.userId, scopes: key.scopes };
    return true;
  }
}
