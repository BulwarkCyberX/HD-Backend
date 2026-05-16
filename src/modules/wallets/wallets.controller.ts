import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { WalletService } from './wallet.service';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly wallets: WalletService) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.wallets.getWalletSummary(user.userId);
  }
}
