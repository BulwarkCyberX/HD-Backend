import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeyRateLimitGuard } from './api-key-rate-limit.guard';
import { IntegrationsService } from './integrations.service';
import { requireApiScope } from './api-scopes';
import { V1CreateReportDto } from './dto/v1-create-report.dto';

type ApiRequest = { apiUser?: { userId: string; scopes: string[] } };

@ApiTags('v1')
@ApiSecurity('api-key')
@ApiHeader({ name: 'X-API-Key', description: 'API key from /integrations/api-keys' })
@Controller('v1')
@UseGuards(ApiKeyGuard, ApiKeyRateLimitGuard)
export class V1Controller {
  constructor(private readonly integrations: IntegrationsService) {}

  private userId(req: ApiRequest) {
    const id = req.apiUser?.userId;
    if (!id) throw new UnauthorizedException('API user missing');
    return id;
  }

  @Get('projects')
  listProjects(
    @Req() req: ApiRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.integrations.listProjectsForApiUser(
      this.userId(req),
      cursor,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('projects/:id')
  getProject(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.integrations.getProjectForApiUser(this.userId(req), id);
  }

  @Get('projects/:id/reports')
  listReports(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.integrations.listReportsForApiUser(this.userId(req), id);
  }

  @Get('projects/:id/milestones')
  listMilestones(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.integrations.listMilestonesForApiUser(this.userId(req), id);
  }

  @Post('projects/:id/reports')
  createReport(@Req() req: ApiRequest, @Param('id') id: string, @Body() dto: V1CreateReportDto) {
    requireApiScope(req.apiUser?.scopes ?? [], 'write:reports');
    return this.integrations.createReportForApiUser(this.userId(req), id, dto);
  }
}
