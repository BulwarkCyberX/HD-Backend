import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { DepositPaymentDto } from './dto/deposit-payment.dto';
import { ReleasePaymentDto } from './dto/release-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('deposit')
  @Roles(UserRole.CLIENT)
  deposit(@CurrentUser() user: RequestUser, @Body() dto: DepositPaymentDto) {
    return this.payments.deposit({
      requesterId: user.userId,
      role: user.role,
      projectId: dto.projectId,
      amount: dto.amount,
      currency: dto.currency,
    });
  }

  @Post('release')
  @Roles(UserRole.CLIENT)
  release(@CurrentUser() user: RequestUser, @Body() dto: ReleasePaymentDto) {
    return this.payments.release({
      requesterId: user.userId,
      role: user.role,
      projectId: dto.projectId,
    });
  }
}
