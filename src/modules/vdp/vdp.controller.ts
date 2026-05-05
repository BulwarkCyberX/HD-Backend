import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateVdpDto } from './dto/create-vdp.dto';
import { VdpReportDto } from './dto/vdp-report.dto';
import { VdpService } from './vdp.service';

@Controller('vdp')
export class VdpController {
  constructor(private readonly vdp: VdpService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateVdpDto) {
    return this.vdp.create({
      clientId: user.userId,
      role: user.role,
      title: dto.title,
      scope: dto.scope,
      policy: dto.policy,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.vdp.getPublic(id);
  }

  @Post('report')
  submitReport(@Body() dto: VdpReportDto) {
    return this.vdp.submitReport({
      vdpId: dto.vdpId,
      title: dto.title,
      description: dto.description,
      contactEmail: dto.contactEmail,
      severity: dto.severity,
    });
  }
}
