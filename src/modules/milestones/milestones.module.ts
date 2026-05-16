import { Module } from '@nestjs/common';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';
import { WalletsModule } from '../wallets/wallets.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [WalletsModule, RealtimeModule, IntegrationsModule],
  controllers: [MilestonesController],
  providers: [MilestonesService],
  exports: [MilestonesService],
})
export class MilestonesModule {}
