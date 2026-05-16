import { Module } from '@nestjs/common';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { WalletsModule } from '../wallets/wallets.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [WalletsModule, KycModule],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
