import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidStatusDto } from './dto/update-bid-status.dto';

@Controller('bids')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Post()
  @Roles(UserRole.PROVIDER)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBidDto) {
    return this.bids.create({
      providerId: user.userId,
      role: user.role,
      projectId: dto.projectId,
      proposal: dto.proposal,
      price: dto.price,
      timeline: dto.timeline,
    });
  }

  @Get('project/:projectId')
  @Roles(UserRole.CLIENT)
  listForProject(@CurrentUser() user: RequestUser, @Param('projectId') projectId: string) {
    return this.bids.listForProject({ requesterId: user.userId, role: user.role, projectId });
  }

  @Get('my')
  @Roles(UserRole.PROVIDER)
  listMine(@CurrentUser() user: RequestUser) {
    return this.bids.listMine({ requesterId: user.userId, role: user.role });
  }

  @Patch(':id/status')
  @Roles(UserRole.CLIENT)
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateBidStatusDto,
  ) {
    return this.bids.updateStatus({
      requesterId: user.userId,
      role: user.role,
      bidId: id,
      status: dto.status,
    });
  }
}
