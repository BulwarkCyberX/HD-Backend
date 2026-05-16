import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { ApproveMilestoneDto } from './dto/approve-milestone.dto';
import { CreateMilestoneCommentDto } from './dto/milestone-comment.dto';

@Controller('milestones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MilestonesController {
  constructor(private readonly milestones: MilestonesService) {}

  @Get('project/:projectId')
  listByProject(@CurrentUser() user: RequestUser, @Param('projectId') projectId: string) {
    return this.milestones.listByProject({
      projectId,
      requesterId: user.userId,
      role: user.role,
    });
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateMilestoneDto) {
    return this.milestones.create({
      requesterId: user.userId,
      role: user.role,
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description ?? '',
      amount: dto.amount,
      currency: dto.currency,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    return this.milestones.update({
      requesterId: user.userId,
      role: user.role,
      milestoneId: id,
      title: dto.title,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency,
    });
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.milestones.remove({ requesterId: user.userId, role: user.role, milestoneId: id });
  }

  @Post(':id/fund')
  fund(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.milestones.fund({ requesterId: user.userId, role: user.role, milestoneId: id });
  }

  @Post(':id/start')
  start(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.milestones.startProgress({ requesterId: user.userId, role: user.role, milestoneId: id });
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.milestones.submit({ requesterId: user.userId, role: user.role, milestoneId: id });
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ApproveMilestoneDto) {
    return this.milestones.approve({
      requesterId: user.userId,
      role: user.role,
      milestoneId: id,
      partialPercent: dto.partialPercent,
    });
  }

  @Post(':id/release')
  release(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.milestones.release({ requesterId: user.userId, role: user.role, milestoneId: id });
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.milestones.reject({ requesterId: user.userId, role: user.role, milestoneId: id });
  }

  @Get(':id/comments')
  listComments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.milestones.listComments({
      milestoneId: id,
      requesterId: user.userId,
      role: user.role,
    });
  }

  @Post(':id/comments')
  addComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateMilestoneCommentDto) {
    return this.milestones.addComment({
      milestoneId: id,
      requesterId: user.userId,
      role: user.role,
      body: dto.body,
    });
  }
}
