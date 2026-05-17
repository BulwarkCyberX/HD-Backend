import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { IntegrationsService } from './integrations.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { PatchWebhookDto } from './dto/patch-webhook.dto';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get('api-keys')
  listApiKeys(@CurrentUser() user: RequestUser) {
    return this.integrations.listApiKeys(user.userId);
  }

  @Post('api-keys')
  createApiKey(@CurrentUser() user: RequestUser, @Body() dto: CreateApiKeyDto) {
    return this.integrations.createApiKey(user.userId, dto.label, dto.scopes);
  }

  @Delete('api-keys/:id')
  revokeApiKey(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.integrations.revokeApiKey(user.userId, id);
  }

  @Get('webhooks')
  listWebhooks(@CurrentUser() user: RequestUser) {
    return this.integrations.listWebhooks(user.userId);
  }

  @Post('webhooks')
  createWebhook(@CurrentUser() user: RequestUser, @Body() dto: CreateWebhookDto) {
    return this.integrations.createWebhook(user.userId, dto);
  }

  @Patch('webhooks/:id')
  patchWebhook(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: PatchWebhookDto,
  ) {
    return this.integrations.setWebhookEnabled(user.userId, id, dto.enabled);
  }

  @Delete('webhooks/:id')
  deleteWebhook(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.integrations.deleteWebhook(user.userId, id);
  }

  @Get('webhooks/:id/deliveries')
  listDeliveries(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.integrations.listDeliveries(user.userId, id);
  }

  @Post('webhooks/:id/test')
  testWebhook(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.integrations.sendWebhookTest(user.userId, id);
  }

  @Post('webhooks/deliveries/:deliveryId/retry')
  retryDelivery(@CurrentUser() user: RequestUser, @Param('deliveryId') deliveryId: string) {
    return this.integrations.retryDelivery(user.userId, deliveryId);
  }
}
