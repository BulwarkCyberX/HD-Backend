import { Module } from '@nestjs/common';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { HourlyModule } from '../hourly/hourly.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { TrustModule } from '../trust/trust.module';

@Module({
  imports: [NotificationsModule, EmailModule, RealtimeModule, HourlyModule, IntegrationsModule, TrustModule],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
