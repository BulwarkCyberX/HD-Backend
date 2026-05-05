import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';
import { TriageReportDto } from './dto/triage-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateReportDto) {
    return this.reports.create({
      projectId: dto.projectId,
      submittedBy: user.userId,
      title: dto.title,
      description: dto.description,
      severity: dto.severity,
    });
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  listAllForAdmin(@CurrentUser() user: RequestUser) {
    return this.reports.listAllForAdmin({ requesterRole: user.role });
  }

  @Get(':projectId')
  listByProject(@CurrentUser() user: RequestUser, @Param('projectId') projectId: string) {
    return this.reports.listByProject({
      projectId,
      requesterId: user.userId,
      requesterRole: user.role,
    });
  }

  @Patch(':id/triage')
  @Roles(UserRole.ADMIN)
  triage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: TriageReportDto) {
    return this.reports.triage({
      reportId: id,
      requesterId: user.userId,
      requesterRole: user.role,
      status: dto.status,
      triageNotes: dto.triageNotes,
    });
  }
}
