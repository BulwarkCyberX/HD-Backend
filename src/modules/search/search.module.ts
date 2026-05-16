import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchPublicController } from './search-public.controller';
import { SearchService } from './search.service';

@Module({
  controllers: [SearchController, SearchPublicController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
