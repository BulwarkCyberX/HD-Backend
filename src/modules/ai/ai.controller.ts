import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { AiService } from './ai.service';
import { AiScopeDto } from './dto/scope.dto';
import { AiProposalDto } from './dto/proposal.dto';
import { AiReportReviewDto } from './dto/report-review.dto';
import { AiRiskDto } from './dto/risk.dto';
import { AiDuplicateDto } from './dto/duplicate.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('scope')
  scope(@CurrentUser() user: RequestUser, @Body() dto: AiScopeDto) {
    return this.ai.suggestScope(dto.description, user.userId);
  }

  @Post('proposal')
  proposal(@CurrentUser() user: RequestUser, @Body() dto: AiProposalDto) {
    return this.ai.improveProposal(dto.proposal, user.userId);
  }

  @Post('report-review')
  reportReview(@CurrentUser() user: RequestUser, @Body() dto: AiReportReviewDto) {
    return this.ai.reviewReport(
      {
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
      },
      user.userId,
    );
  }

  @Post('risk')
  risk(@CurrentUser() user: RequestUser, @Body() dto: AiRiskDto) {
    return this.ai.classifyRisk({ title: dto.title, description: dto.description }, user.userId);
  }

  @Post('duplicate-hint')
  duplicate(@CurrentUser() user: RequestUser, @Body() dto: AiDuplicateDto) {
    return this.ai.duplicateHint(dto.a, dto.b, user.userId);
  }
}
