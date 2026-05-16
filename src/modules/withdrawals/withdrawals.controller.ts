import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawals: WithdrawalsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawals.create({
      userId: user.userId,
      role: user.role,
      amount: dto.amount,
      currency: dto.currency,
    });
  }

  @Get('me')
  listMine(@CurrentUser() user: RequestUser) {
    return this.withdrawals.listMine(user.userId);
  }

  @Get('admin/pending')
  @Roles(UserRole.ADMIN)
  listPending(@CurrentUser() user: RequestUser) {
    return this.withdrawals.listPendingAdmin(user.role);
  }

  @Patch('admin/:id/approve')
  @Roles(UserRole.ADMIN)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.withdrawals.approve({ adminId: user.userId, role: user.role, withdrawalId: id });
  }

  @Patch('admin/:id/reject')
  @Roles(UserRole.ADMIN)
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.withdrawals.reject({ adminId: user.userId, role: user.role, withdrawalId: id });
  }
}
