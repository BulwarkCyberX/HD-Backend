import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { CompleteProjectDto } from './dto/complete-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateProjectDto) {
    return this.projects.create({
      userId: user.userId,
      role: user.role,
      title: dto.title,
      description: dto.description,
      assets: dto.assets,
      inScope: dto.inScope,
      outOfScope: dto.outOfScope,
      testingWindow: dto.testingWindow,
      budgetType: dto.budgetType,
      budgetAmount: dto.budgetAmount,
      timeline: dto.timeline,
      visibility: dto.visibility,
    });
  }

  @Get()
  listAll() {
    return this.projects.listAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.projects.getById(id);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  complete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CompleteProjectDto) {
    return this.projects.completeProject({
      projectId: id,
      requesterId: user.userId,
      role: user.role,
      explicitClientConfirmation: dto.explicitClientConfirmation ?? false,
    });
  }
}

