import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateOrganizationDto) {
    return this.orgs.create({
      ownerId: user.userId,
      role: user.role,
      name: dto.name,
      slug: dto.slug,
    });
  }

  @Get('me')
  listMine(@CurrentUser() user: RequestUser) {
    return this.orgs.listMine(user.userId);
  }

  @Post(':id/members')
  addMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.orgs.addMember({
      orgId: id,
      requesterId: user.userId,
      email: dto.email,
      role: dto.role,
    });
  }
}
