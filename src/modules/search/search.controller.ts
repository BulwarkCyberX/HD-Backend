import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { SearchService } from './search.service';
import { CreateSavedSearchDto } from './dto/saved-search.dto';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get('projects')
  projects(@CurrentUser() user: RequestUser, @Query('q') q?: string) {
    return this.search.searchProjects({
      q: q ?? '',
      requesterId: user.userId,
      role: user.role,
    });
  }

  @Get('providers')
  providers(@Query('q') q?: string) {
    return this.search.searchProviders({ q: q ?? '' });
  }

  @Get('saved/me')
  savedMine(@CurrentUser() user: RequestUser) {
    return this.search.listSavedSearches(user.userId);
  }

  @Post('saved')
  saveSearch(@CurrentUser() user: RequestUser, @Body() dto: CreateSavedSearchDto) {
    return this.search.createSavedSearch(user.userId, dto.name, dto.queryJson);
  }
}
