import { Module } from '@nestjs/common';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';
import { WalletsModule } from '../wallets/wallets.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [WalletsModule, RealtimeModule],
  controllers: [MilestonesController],
  providers: [MilestonesService],
  exports: [MilestonesService],
})
export class MilestonesModule {}
