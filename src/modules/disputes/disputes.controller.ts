import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DisputeStatus, UserRole } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputeCommentDto } from './dto/dispute-comment.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateDisputeDto) {
    return this.disputes.create({
      requesterId: user.userId,
      role: user.role,
      projectId: dto.projectId,
      category: dto.category,
      title: dto.title,
      description: dto.description,
    });
  }

  @Get('project/:projectId')
  listForProject(@CurrentUser() user: RequestUser, @Param('projectId') projectId: string) {
    return this.disputes.listForProject({ projectId, requesterId: user.userId, role: user.role });
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  listAdmin(@CurrentUser() user: RequestUser) {
    return this.disputes.listAdmin(user.role);
  }

  @Patch('admin/:id/review')
  @Roles(UserRole.ADMIN)
  markReview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.disputes.markReview({ disputeId: id, adminId: user.userId, role: user.role });
  }

  @Patch('admin/:id/resolve')
  @Roles(UserRole.ADMIN)
  resolve(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputes.resolve({
      disputeId: id,
      adminId: user.userId,
      role: user.role,
      status: dto.status as DisputeStatus,
      resolution: dto.resolution,
    });
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: DisputeCommentDto,
  ) {
    return this.disputes.addComment({
      disputeId: id,
      requesterId: user.userId,
      role: user.role,
      body: dto.body,
      internal: dto.internal,
    });
  }
}
