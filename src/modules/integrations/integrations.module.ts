import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntegrationsController } from './integrations.controller';
import { V1Controller } from './v1.controller';
import { IntegrationsService } from './integrations.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookProcessor } from './webhook.processor';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeyRateLimitGuard } from './api-key-rate-limit.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'webhooks' }), forwardRef(() => ReportsModule)],
  controllers: [IntegrationsController, V1Controller],
  providers: [
    IntegrationsService,
    WebhookDeliveryService,
    WebhookDispatcherService,
    WebhookProcessor,
    ApiKeyGuard,
    ApiKeyRateLimitGuard,
  ],
  exports: [IntegrationsService, WebhookDispatcherService],
})
export class IntegrationsModule {}
