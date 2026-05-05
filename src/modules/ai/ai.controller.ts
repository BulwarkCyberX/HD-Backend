import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiScopeDto } from './dto/scope.dto';
import { AiProposalDto } from './dto/proposal.dto';
import { AiReportReviewDto } from './dto/report-review.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('scope')
  scope(@Body() dto: AiScopeDto) {
    return this.ai.suggestScope(dto.description);
  }

  @Post('proposal')
  proposal(@Body() dto: AiProposalDto) {
    return this.ai.improveProposal(dto.proposal);
  }

  @Post('report-review')
  reportReview(@Body() dto: AiReportReviewDto) {
    return this.ai.reviewReport({
      title: dto.title,
      description: dto.description,
      severity: dto.severity,
    });
  }
}
