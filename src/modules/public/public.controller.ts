import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly pub: PublicService) {}

  @Get('projects')
  listProjects(
    @Query('q') q?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
    @Query('budgetType') budgetType?: string,
    @Query('skill') skill?: string,
    @Query('sort') sort?: 'newest' | 'budget_asc' | 'budget_desc',
  ) {
    return this.pub.listPublicProjects({
      q,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
      budgetType,
      skill,
      sort: sort ?? 'newest',
    });
  }

  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.pub.getPublicProject(id);
  }

  @Get('providers/featured/list')
  featuredProviders() {
    return this.pub.listFeaturedProviders();
  }

  @Get('providers/:id')
  getProvider(@Param('id') id: string) {
    return this.pub.getPublicProvider(id);
  }
}
