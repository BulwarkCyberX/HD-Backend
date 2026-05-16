import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { TrustService } from './trust.service';
import { ModerationAuditDto } from './dto/moderation-audit.dto';

@Controller('trust')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  @Post('moderation-audit')
  @Roles(UserRole.ADMIN)
  audit(@CurrentUser() user: RequestUser, @Body() dto: ModerationAuditDto) {
    return this.trust.logModeration({
      actorId: user.userId,
      action: dto.action,
      targetType: dto.targetType,
      targetId: dto.targetId,
      metadata: dto.metadata,
    });
  }
}
