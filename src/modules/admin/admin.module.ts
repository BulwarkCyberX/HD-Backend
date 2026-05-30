import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { BidsModule } from '../bids/bids.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TrustModule } from '../trust/trust.module';
import { AdminController } from './admin.controller';
import { AdminProjectsService } from './admin-projects.service';
import { PlatformSettingsService } from './platform-settings.service';

@Module({
  imports: [EmailModule, BidsModule, AnalyticsModule, TrustModule],
  controllers: [AdminController],
  providers: [AdminProjectsService, PlatformSettingsService],
  exports: [PlatformSettingsService],
})
export class AdminModule {}
