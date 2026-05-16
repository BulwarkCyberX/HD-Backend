import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { HourlyService } from './hourly.service';
import { UpsertHourlyEngagementDto } from './dto/upsert-engagement.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { RejectTimeEntryDto } from './dto/reject-time-entry.dto';
import { SetEngagementStatusDto } from './dto/set-engagement-status.dto';

@ApiTags('hourly')
@ApiBearerAuth()
@Controller('hourly')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HourlyController {
  constructor(private readonly hourly: HourlyService) {}

  @Get('project/:projectId')
  getByProject(@CurrentUser() user: RequestUser, @Param('projectId') projectId: string) {
    return this.hourly.getByProject({ projectId, requesterId: user.userId, role: user.role });
  }

  @Get('project/:projectId/summary')
  getSummary(@CurrentUser() user: RequestUser, @Param('projectId') projectId: string) {
    return this.hourly.getProjectSummary({ projectId, requesterId: user.userId, role: user.role });
  }

  @Patch('project/:projectId/engagement/status')
  setEngagementStatus(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() dto: SetEngagementStatusDto,
  ) {
    return this.hourly.setEngagementStatus({
      requesterId: user.userId,
      role: user.role,
      projectId,
      status: dto.status,
    });
  }

  @Post('project/:projectId/engagement')
  upsertEngagement(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpsertHourlyEngagementDto,
  ) {
    return this.hourly.upsertEngagement({
      requesterId: user.userId,
      role: user.role,
      projectId,
      hourlyRate: dto.hourlyRate,
      weeklyCapHours: dto.weeklyCapHours,
      currency: dto.currency,
    });
  }

  @Post('time-entries')
  createEntry(@CurrentUser() user: RequestUser, @Body() dto: CreateTimeEntryDto) {
    return this.hourly.createTimeEntry({
      requesterId: user.userId,
      role: user.role,
      engagementId: dto.engagementId,
      workDate: dto.workDate,
      hours: dto.hours,
      description: dto.description,
    });
  }

  @Patch('time-entries/:id')
  updateEntry(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryDto,
  ) {
    return this.hourly.updateTimeEntry({
      requesterId: user.userId,
      role: user.role,
      entryId: id,
      workDate: dto.workDate,
      hours: dto.hours,
      description: dto.description,
    });
  }

  @Post('time-entries/:id/submit')
  submitEntry(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hourly.submitTimeEntry({ requesterId: user.userId, role: user.role, entryId: id });
  }

  @Post('time-entries/:id/approve')
  approveEntry(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hourly.approveTimeEntry({ requesterId: user.userId, role: user.role, entryId: id });
  }

  @Post('time-entries/:id/reject')
  rejectEntry(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectTimeEntryDto,
  ) {
    return this.hourly.rejectTimeEntry({
      requesterId: user.userId,
      role: user.role,
      entryId: id,
      reason: dto.reason,
    });
  }

  @Post('time-entries/:id/bill')
  billEntry(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.hourly.billTimeEntry({ requesterId: user.userId, role: user.role, entryId: id });
  }
}
