import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntegrationsController } from './integrations.controller';
import { V1Controller } from './v1.controller';
import { IntegrationsService } from './integrations.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookProcessor } from './webhook.processor';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'webhooks' })],
  controllers: [IntegrationsController, V1Controller],
  providers: [
    IntegrationsService,
    WebhookDeliveryService,
    WebhookDispatcherService,
    WebhookProcessor,
    ApiKeyGuard,
  ],
  exports: [IntegrationsService, WebhookDispatcherService],
})
export class IntegrationsModule {}
