import { Injectable, Logger } from '@nestjs/common';
import { ReportSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';

export type ReportAiTriageHints = {
  suggestedSeverity: ReportSeverity | null;
  submittedSeverity: ReportSeverity;
  severityMatch: boolean;
  rationale: string;
  completeness: string;
  missingFields: string[];
  checklist: string[];
  duplicate: {
    likelyDuplicate: boolean;
    score: number;
    comparedReportId?: string;
    rationale?: string;
  } | null;
  generatedAt: string;
};

@Injectable()
export class AiTriageService {
  private readonly logger = new Logger(AiTriageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async runForReport(reportId: string, actorUserId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        severity: true,
      },
    });
    if (!report) return null;

    const hints = await this.buildHints(report, actorUserId);
    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { aiTriageHints: hints as object },
      select: { id: true, aiTriageHints: true },
    });
    return updated.aiTriageHints as ReportAiTriageHints;
  }

  private async buildHints(
    report: {
      id: string;
      projectId: string;
      title: string;
      description: string;
      severity: ReportSeverity;
    },
    actorUserId: string,
  ): Promise<ReportAiTriageHints> {
    const [risk, review, duplicate] = await Promise.all([
      this.ai.classifyRisk({ title: report.title, description: report.description }, actorUserId),
      this.ai.reviewReport(
        { title: report.title, description: report.description, severity: report.severity },
        actorUserId,
      ),
      this.findDuplicateHint(report, actorUserId),
    ]);

    const suggestedSeverity = this.mapSeverityLabel(String(risk.label ?? risk['label'] ?? ''));
    const reviewObj = review as Record<string, unknown>;
    const missingFields = Array.isArray(reviewObj.missingFields)
      ? (reviewObj.missingFields as string[])
      : [];
    const checklist = Array.isArray(reviewObj.checklist) ? (reviewObj.checklist as string[]) : [];

    return {
      suggestedSeverity,
      submittedSeverity: report.severity,
      severityMatch: suggestedSeverity ? suggestedSeverity === report.severity : true,
      rationale: String(risk.rationale ?? risk['rationale'] ?? 'No rationale'),
      completeness: String(reviewObj.completeness ?? 'Unknown'),
      missingFields,
      checklist,
      duplicate,
      generatedAt: new Date().toISOString(),
    };
  }

  private async findDuplicateHint(
    report: { id: string; projectId: string; title: string; description: string },
    actorUserId: string,
  ) {
    const peers = await this.prisma.report.findMany({
      where: { projectId: report.projectId, id: { not: report.id } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, description: true },
    });
    if (peers.length === 0) return null;

    let best: ReportAiTriageHints['duplicate'] = null;
    for (const peer of peers) {
      try {
        const hint = (await this.ai.duplicateHint(
          `${report.title}\n${report.description}`,
          `${peer.title}\n${peer.description}`,
          actorUserId,
        )) as Record<string, unknown>;
        const likely = Boolean(hint.likelyDuplicate);
        const score = Number(hint.score ?? 0);
        if (!best || score > best.score) {
          best = {
            likelyDuplicate: likely,
            score,
            comparedReportId: peer.id,
            rationale: String(hint.rationale ?? ''),
          };
        }
        if (likely && score >= 0.75) break;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Duplicate hint failed for report ${report.id}: ${message}`);
      }
    }
    return best;
  }

  private mapSeverityLabel(label: string): ReportSeverity | null {
    const u = label.toUpperCase();
    if (u === 'LOW' || u === 'MEDIUM' || u === 'HIGH' || u === 'CRITICAL') {
      return u as ReportSeverity;
    }
    return null;
  }
}
