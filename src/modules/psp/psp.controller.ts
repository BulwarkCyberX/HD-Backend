import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { VerifyCheckoutDto } from './dto/verify-checkout.dto';
import { PspCheckoutService } from './psp-checkout.service';

@Controller('payments')
export class PspController {
  constructor(private readonly checkout: PspCheckoutService) {}

  @Post('checkout/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  createCheckout(@CurrentUser() user: RequestUser, @Body() dto: CreateCheckoutDto) {
    return this.checkout.createCheckout({
      requesterId: user.userId,
      role: user.role,
      projectId: dto.projectId,
      amount: dto.amount,
      currency: dto.currency,
      idempotencyKey: dto.idempotencyKey,
      preferredProvider: dto.preferredProvider,
    });
  }

  @Post('checkout/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  verifyCheckout(@CurrentUser() user: RequestUser, @Body() dto: VerifyCheckoutDto) {
    return this.checkout.verifyClientPayment({
      requesterId: user.userId,
      role: user.role,
      sessionId: dto.sessionId,
      providerPaymentId: dto.providerPaymentId,
      providerOrderId: dto.providerOrderId,
      signature: dto.signature,
    });
  }

  @Get('transactions/me')
  @UseGuards(JwtAuthGuard)
  myTransactions(@CurrentUser() user: RequestUser) {
    return this.checkout.listTransactions(user.userId, user.role);
  }
}
