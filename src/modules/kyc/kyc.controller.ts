import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { KycService } from './kyc.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kyc: KycService) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.kyc.getStatus(user.userId);
  }

  @Post('submit')
  submit(@CurrentUser() user: RequestUser, @Body() dto: SubmitKycDto) {
    return this.kyc.submit({
      userId: user.userId,
      panNumber: dto.panNumber,
      panHolderName: dto.panHolderName,
      bankAccountNumber: dto.bankAccountNumber,
      bankIfsc: dto.bankIfsc,
      bankAccountHolder: dto.bankAccountHolder,
    });
  }

  @Get('admin/pending')
  @ApiOperation({ summary: 'List pending KYC submissions (admin)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  pending(@CurrentUser() user: RequestUser) {
    return this.kyc.listPendingAdmin(user.role);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  review(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ReviewKycDto) {
    return this.kyc.review({
      adminId: user.userId,
      role: user.role,
      submissionId: id,
      approve: dto.approve,
      adminNotes: dto.adminNotes,
    });
  }
}
