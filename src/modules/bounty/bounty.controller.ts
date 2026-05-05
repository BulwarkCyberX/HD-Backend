import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { BountyService } from './bounty.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { UpdateBugReportStatusDto } from './dto/update-bug-report-status.dto';

@Controller('bounty')
@UseGuards(JwtAuthGuard)
export class BountyController {
  constructor(private readonly bounty: BountyService) {}

  @Post('programs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  createProgram(@CurrentUser() user: RequestUser, @Body() dto: CreateProgramDto) {
    return this.bounty.createProgram({
      clientId: user.userId,
      role: user.role,
      title: dto.title,
      description: dto.description ?? '',
      scope: dto.scope,
      rewardTable: dto.rewardTable,
      status: dto.status,
      allowedResearcherIds: dto.allowedResearcherIds,
    });
  }

  @Get('programs')
  listPrograms(@CurrentUser() user: RequestUser) {
    return this.bounty.listPrograms({ requesterId: user.userId, role: user.role });
  }

  @Get('programs/:id')
  getProgram(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bounty.getProgram({ id, requesterId: user.userId, role: user.role });
  }

  @Post('reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  submitReport(@CurrentUser() user: RequestUser, @Body() dto: CreateBugReportDto) {
    return this.bounty.createBugReport({
      researcherId: user.userId,
      role: user.role,
      programId: dto.programId,
      title: dto.title,
      description: dto.description,
      severity: dto.severity,
    });
  }

  @Get('reports/:programId')
  listReports(@CurrentUser() user: RequestUser, @Param('programId') programId: string) {
    return this.bounty.listReportsForProgram({
      programId,
      requesterId: user.userId,
      role: user.role,
    });
  }

  @Patch('reports/:id/status')
  updateReportStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateBugReportStatusDto,
  ) {
    return this.bounty.updateBugReportStatus({
      reportId: id,
      requesterId: user.userId,
      role: user.role,
      status: dto.status,
    });
  }
}
