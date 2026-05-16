import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

/** Guest-accessible search (no JWT). */
@Controller('public/search')
export class SearchPublicController {
  constructor(private readonly search: SearchService) {}

  @Get('projects')
  projects(@Query('q') q?: string) {
    return this.search.searchPublicProjects({ q: q ?? '' });
  }

  @Get('providers')
  providers(@Query('q') q?: string) {
    return this.search.searchProviders({ q: q ?? '' });
  }

  @Get('trending/projects')
  trendingProjects() {
    return this.search.trendingProjects();
  }
}
