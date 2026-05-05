import { Injectable } from '@nestjs/common';
import { ReportSeverity } from '@prisma/client';

/**
 * Mock AI layer — replace internals with OpenAI or similar when keys are configured.
 * Outputs are advisory only; no automated decisions.
 */
@Injectable()
export class AiService {
  suggestScope(description: string) {
    const lower = description.toLowerCase();
    const assets: { type: string; value: string }[] = [];
    if (lower.includes('api')) assets.push({ type: 'URL', value: 'https://api.example.com' });
    if (lower.includes('app') || lower.includes('web')) {
      assets.push({ type: 'DOMAIN', value: 'app.example.com' });
    }
    if (assets.length === 0) {
      assets.push({ type: 'DOMAIN', value: 'primary.target.example' });
    }

    return {
      suggestionsOnly: true,
      assets,
      inScope: [
        'Authenticated web application testing',
        'Business-logic flaws in primary product surface',
        'Documented API endpoints under agreed rate limits',
      ],
      outOfScope: [
        'Physical security or social engineering',
        'Third-party services not listed as in-scope assets',
        'Denial-of-service testing without written approval',
      ],
      testingWindow: 'Suggest a 14-day coordinated testing window.',
      notes:
        'These scope suggestions are generated heuristically from your description. Review and edit before publishing.',
    };
  }

  improveProposal(proposal: string) {
    const trimmed = proposal.trim();
    const additions = [
      'Explicit testing methodology and tooling assumptions.',
      'Deliverables (report format, severity mapping, retest policy).',
      'Timeline milestones aligned with the client testing window.',
    ];

    return {
      suggestionsOnly: true,
      improved: `${trimmed}\n\n---\nSuggested additions:\n${additions.map((l) => `- ${l}`).join('\n')}`,
      hints: additions,
    };
  }

  reviewReport(input: { title: string; description: string; severity: ReportSeverity }) {
    const missing: string[] = [];
    if (input.title.length < 8) missing.push('Expand title with affected component or CVE class');
    if (input.description.length < 80) missing.push('Add step-by-step reproduction and observed vs expected behavior');
    if (!/impact|severity|risk/i.test(input.description)) {
      missing.push('Clarify security impact in plain language');
    }
    if (input.severity === ReportSeverity.CRITICAL && input.description.length < 120) {
      missing.push('Critical findings usually need detailed blast-radius analysis');
    }

    return {
      suggestionsOnly: true,
      completeness: missing.length === 0 ? 'Likely sufficient for triage' : 'Likely incomplete',
      missingFields: missing,
      checklist: [
        'Asset identifier included?',
        'Reproduction reliable?',
        'Impact on confidentiality / integrity / availability stated?',
      ],
    };
  }
}
