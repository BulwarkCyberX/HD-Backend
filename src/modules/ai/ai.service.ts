import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiJobType, Prisma, ReportSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../redis/redis.module';
import type Redis from 'ioredis';

const DAILY_LIMIT = 80;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI | null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | undefined,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    this.client = key ? new OpenAI({ apiKey: key }) : null;
  }

  private async rateLimit(userId: string) {
    if (!this.redis) return;
    const day = new Date().toISOString().slice(0, 10);
    const k = `ai:usage:${userId}:${day}`;
    const n = await this.redis.incr(k);
    if (n === 1) await this.redis.expire(k, 86400);
    if (n > DAILY_LIMIT) {
      throw new HttpException('AI daily limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async logUsage(userId: string, job: AiJobType, meta?: Record<string, unknown>) {
    await this.prisma.aiUsageLog.create({
      data: {
        userId,
        jobType: job,
        metadata: meta ? (meta as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  private async completeJson(
    userId: string,
    job: AiJobType,
    system: string,
    user: string,
  ): Promise<Record<string, unknown>> {
    if (!this.client) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }
    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const res = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    });
    const text = res.choices[0]?.message?.content ?? '{}';
    const usage = res.usage;
    await this.logUsage(userId, job, {
      tokensIn: usage?.prompt_tokens,
      tokensOut: usage?.completion_tokens,
    });
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      this.logger.warn('AI returned non-JSON');
      return { raw: text };
    }
  }

  async suggestScope(description: string, userId: string) {
    await this.rateLimit(userId);
    if (!this.client) {
      return this.mockScope(description);
    }
    const out = await this.completeJson(
      userId,
      AiJobType.SCOPE_REVIEW,
      'You help define penetration-test scope. Reply JSON with keys: assets (array of {type,value}), inScope (string[]), outOfScope (string[]), testingWindow (string), notes (string).',
      `Project description:\n${description}`,
    );
    return { suggestionsOnly: true, ...out };
  }

  async improveProposal(proposal: string, userId: string) {
    await this.rateLimit(userId);
    if (!this.client) {
      return this.mockProposal(proposal);
    }
    const out = await this.completeJson(
      userId,
      AiJobType.PROPOSAL_ENHANCE,
      'Improve security consulting proposals. JSON keys: improved (string), hints (string[]).',
      proposal,
    );
    return { suggestionsOnly: true, ...out };
  }

  async reviewReport(input: { title: string; description: string; severity: ReportSeverity }, userId: string) {
    await this.rateLimit(userId);
    if (!this.client) {
      return this.mockReview(input);
    }
    const out = await this.completeJson(
      userId,
      AiJobType.REPORT_ANALYSIS,
      'Review vulnerability reports. JSON keys: completeness (string), missingFields (string[]), checklist (string[]).',
      JSON.stringify(input),
    );
    return { suggestionsOnly: true, ...out };
  }

  async classifyRisk(input: { title: string; description: string }, userId: string) {
    await this.rateLimit(userId);
    if (!this.client) {
      return this.mockRiskClassification(input);
    }
    return this.completeJson(
      userId,
      AiJobType.RISK_CLASSIFICATION,
      'Classify security risk for a pentest report. JSON keys: label (LOW|MEDIUM|HIGH|CRITICAL only), rationale (string).',
      JSON.stringify(input),
    );
  }

  async duplicateHint(a: string, b: string, userId: string) {
    await this.rateLimit(userId);
    if (!this.client) {
      return { likelyDuplicate: false, score: 0, note: 'Configure OPENAI_API_KEY for semantic duplicate hints.' };
    }
    return this.completeJson(
      userId,
      AiJobType.DUPLICATE_DETECTION,
      'Compare two vulnerability descriptions. JSON keys: likelyDuplicate (boolean), score (0-1 number), rationale (string).',
      JSON.stringify({ a, b }),
    );
  }

  private mockScope(description: string) {
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
      inScope: ['Authenticated web application testing'],
      outOfScope: ['Physical security'],
      testingWindow: '14-day coordinated window.',
      notes: 'Heuristic mock (no OpenAI key).',
    };
  }

  private mockProposal(proposal: string) {
    const trimmed = proposal.trim();
    return {
      suggestionsOnly: true,
      improved: `${trimmed}\n\n---\nSuggested additions:\n- Methodology\n- Deliverables`,
      hints: ['Methodology', 'Deliverables'],
    };
  }

  private mockRiskClassification(input: { title: string; description: string }) {
    const text = `${input.title} ${input.description}`.toLowerCase();
    let label: ReportSeverity = ReportSeverity.MEDIUM;
    if (text.includes('rce') || text.includes('critical') || text.includes('auth bypass')) {
      label = ReportSeverity.CRITICAL;
    } else if (text.includes('sql') || text.includes('xss') || text.includes('high')) {
      label = ReportSeverity.HIGH;
    } else if (text.includes('info') || text.includes('low')) {
      label = ReportSeverity.LOW;
    }
    return {
      label,
      rationale: 'Heuristic mock severity (set OPENAI_API_KEY for live triage).',
    };
  }

  private mockReview(input: { title: string; description: string; severity: ReportSeverity }) {
    const missing: string[] = [];
    if (input.title.length < 8) missing.push('Expand title');
    if (input.description.length < 80) missing.push('Add reproduction steps');
    return {
      suggestionsOnly: true,
      completeness: missing.length === 0 ? 'Likely sufficient' : 'Likely incomplete',
      missingFields: missing,
      checklist: ['Asset?', 'Impact?'],
    };
  }
}
