import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { BidsModule } from '../bids/bids.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AdminController } from './admin.controller';
import { AdminProjectsService } from './admin-projects.service';

@Module({
  imports: [EmailModule, BidsModule, AnalyticsModule],
  controllers: [AdminController],
  providers: [AdminProjectsService],
})
export class AdminModule {}
