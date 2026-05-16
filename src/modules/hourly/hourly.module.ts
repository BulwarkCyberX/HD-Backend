import { Module } from '@nestjs/common';
import { HourlyController } from './hourly.controller';
import { HourlyService } from './hourly.service';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [WalletsModule],
  controllers: [HourlyController],
  providers: [HourlyService],
  exports: [HourlyService],
})
export class HourlyModule {}
