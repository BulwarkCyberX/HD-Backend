import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PlatformFeeService } from './platform-fee.service';
import { WalletsController } from './wallets.controller';

@Module({
  controllers: [WalletsController],
  providers: [WalletService, PlatformFeeService],
  exports: [WalletService, PlatformFeeService],
})
export class WalletsModule {}
