import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProjectStatus, ProjectVisibility, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { EmailTemplateService } from '../email/email-template.service';
import { AdminProjectsService } from './admin-projects.service';
import { BidsService } from '../bids/bids.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { AdminUpdateProjectDto } from './dto/admin-update-project.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly emailTemplates: EmailTemplateService,
    private readonly adminProjects: AdminProjectsService,
    private readonly bids: BidsService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('overview')
  overview() {
    return {
      sections: [
        { id: 'projects', label: 'Projects', href: '/dashboard/admin/projects' },
        { id: 'reports', label: 'Report triage', href: '/dashboard/admin/reports' },
        { id: 'disputes', label: 'Disputes', href: '/dashboard/admin/disputes' },
        { id: 'kyc', label: 'KYC queue', href: '/dashboard/admin/kyc' },
        { id: 'emails', label: 'Email templates', href: '/dashboard/admin/emails' },
        { id: 'analytics', label: 'Analytics', href: '/dashboard/admin/analytics' },
        { id: 'settings', label: 'Platform settings', href: '/dashboard/admin/settings' },
      ],
    };
  }

  @Get('analytics/summary')
  analyticsSummary() {
    return this.analytics.adminSummary();
  }

  @Get('email-templates')
  listEmailTemplates() {
    return this.emailTemplates.list();
  }

  @Get('email-templates/:key/variables')
  sampleVariables(@Param('key') key: string) {
    return this.emailTemplates.sampleVariables(key);
  }

  @Get('email-templates/:key')
  getEmailTemplate(@Param('key') key: string) {
    return this.emailTemplates.getByKey(key);
  }

  @Patch('email-templates/:key')
  updateEmailTemplate(
    @CurrentUser() user: RequestUser,
    @Param('key') key: string,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.emailTemplates.update(key, {
      ...dto,
      preheader: dto.preheader === undefined ? undefined : dto.preheader || null,
      updatedById: user.userId,
    });
  }

  @Post('email-templates/:key/preview')
  previewEmailTemplate(
    @Param('key') key: string,
    @Body() body?: { variables?: Record<string, string> },
  ) {
    const vars = body?.variables ?? this.emailTemplates.sampleVariables(key);
    return this.emailTemplates.preview(key, vars);
  }

  @Get('projects')
  listProjects(
    @Query('status') status?: ProjectStatus,
    @Query('visibility') visibility?: ProjectVisibility,
    @Query('q') q?: string,
  ) {
    return this.adminProjects.list({ status, visibility, q });
  }

  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.adminProjects.getById(id);
  }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() dto: AdminUpdateProjectDto) {
    return this.adminProjects.update(id, {
      ...dto,
      selectedProviderId:
        dto.selectedProviderId === undefined ? undefined : dto.selectedProviderId || null,
    });
  }

  @Post('projects/:projectId/bids/:bidId/accept')
  acceptBid(@Param('bidId') bidId: string) {
    return this.bids.acceptBidAsAdmin(bidId);
  }

  @Get('projects/:id/financials')
  projectFinancials(@Param('id') id: string) {
    return this.adminProjects.getFinancials(id);
  }
}
