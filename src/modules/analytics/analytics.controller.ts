import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('admin/summary')
  @Roles(UserRole.ADMIN)
  adminSummary() {
    return this.analytics.adminSummary();
  }

  @Get('provider/me')
  @Roles(UserRole.PROVIDER)
  providerMe(@CurrentUser() user: RequestUser) {
    return this.analytics.providerFor(user.userId);
  }

  @Get('client/me')
  @Roles(UserRole.CLIENT)
  clientMe(@CurrentUser() user: RequestUser) {
    return this.analytics.clientFor(user.userId);
  }
}
