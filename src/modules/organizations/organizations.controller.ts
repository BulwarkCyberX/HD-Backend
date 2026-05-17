import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { LinkProjectDto } from './dto/link-project.dto';
import { EnterpriseSsoService } from '../enterprise-sso/enterprise-sso.service';
import { UpsertOrgSsoDto } from '../enterprise-sso/dto/upsert-org-sso.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly orgs: OrganizationsService,
    private readonly sso: EnterpriseSsoService,
  ) {}

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

  @Get(':id')
  getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orgs.getById(id, user.userId);
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

  @Get(':id/projects/linkable')
  listLinkable(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orgs.listLinkableProjects(id, user.userId);
  }

  @Post(':id/projects')
  @ApiOperation({ summary: 'Link an owned project to this organization' })
  linkProject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LinkProjectDto) {
    return this.orgs.linkProject({
      orgId: id,
      projectId: dto.projectId,
      requesterId: user.userId,
    });
  }

  @Delete(':id/projects/:projectId')
  unlinkProject(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('projectId') projectId: string,
  ) {
    return this.orgs.unlinkProject({
      orgId: id,
      projectId,
      requesterId: user.userId,
    });
  }

  @Get(':id/sso')
  getSso(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sso.getConfigForMember(id, user.userId);
  }

  @Put(':id/sso')
  upsertSso(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertOrgSsoDto) {
    return this.sso.upsertConfig(id, user.userId, dto);
  }

  @Delete(':id/sso')
  deleteSso(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sso.deleteConfig(id, user.userId);
  }
}
