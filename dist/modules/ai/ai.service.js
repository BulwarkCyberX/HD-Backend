"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_module_1 = require("../../redis/redis.module");
const DAILY_LIMIT = 80;
let AiService = AiService_1 = class AiService {
    constructor(config, prisma, redis) {
        this.config = config;
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(AiService_1.name);
        const key = this.config.get('OPENAI_API_KEY');
        this.client = key ? new openai_1.default({ apiKey: key }) : null;
    }
    async rateLimit(userId) {
        if (!this.redis)
            return;
        const day = new Date().toISOString().slice(0, 10);
        const k = `ai:usage:${userId}:${day}`;
        const n = await this.redis.incr(k);
        if (n === 1)
            await this.redis.expire(k, 86400);
        if (n > DAILY_LIMIT) {
            throw new common_1.HttpException('AI daily limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    async logUsage(userId, job, meta) {
        await this.prisma.aiUsageLog.create({
            data: {
                userId,
                jobType: job,
                metadata: meta ? meta : undefined,
            },
        });
    }
    async completeJson(userId, job, system, user) {
        if (!this.client) {
            throw new common_1.ServiceUnavailableException('OPENAI_API_KEY is not configured');
        }
        const model = this.config.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
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
            return JSON.parse(text);
        }
        catch {
            this.logger.warn('AI returned non-JSON');
            return { raw: text };
        }
    }
    async suggestScope(description, userId) {
        await this.rateLimit(userId);
        if (!this.client) {
            return this.mockScope(description);
        }
        const out = await this.completeJson(userId, client_1.AiJobType.SCOPE_REVIEW, 'You help define penetration-test scope. Reply JSON with keys: assets (array of {type,value}), inScope (string[]), outOfScope (string[]), testingWindow (string), notes (string).', `Project description:\n${description}`);
        return { suggestionsOnly: true, ...out };
    }
    async improveProposal(proposal, userId) {
        await this.rateLimit(userId);
        if (!this.client) {
            return this.mockProposal(proposal);
        }
        const out = await this.completeJson(userId, client_1.AiJobType.PROPOSAL_ENHANCE, 'Improve security consulting proposals. JSON keys: improved (string), hints (string[]).', proposal);
        return { suggestionsOnly: true, ...out };
    }
    async reviewReport(input, userId) {
        await this.rateLimit(userId);
        if (!this.client) {
            return this.mockReview(input);
        }
        const out = await this.completeJson(userId, client_1.AiJobType.REPORT_ANALYSIS, 'Review vulnerability reports. JSON keys: completeness (string), missingFields (string[]), checklist (string[]).', JSON.stringify(input));
        return { suggestionsOnly: true, ...out };
    }
    async classifyRisk(input, userId) {
        await this.rateLimit(userId);
        if (!this.client) {
            return this.mockRiskClassification(input);
        }
        return this.completeJson(userId, client_1.AiJobType.RISK_CLASSIFICATION, 'Classify security risk for a pentest report. JSON keys: label (LOW|MEDIUM|HIGH|CRITICAL only), rationale (string).', JSON.stringify(input));
    }
    async duplicateHint(a, b, userId) {
        await this.rateLimit(userId);
        if (!this.client) {
            return { likelyDuplicate: false, score: 0, note: 'Configure OPENAI_API_KEY for semantic duplicate hints.' };
        }
        return this.completeJson(userId, client_1.AiJobType.DUPLICATE_DETECTION, 'Compare two vulnerability descriptions. JSON keys: likelyDuplicate (boolean), score (0-1 number), rationale (string).', JSON.stringify({ a, b }));
    }
    mockScope(description) {
        const lower = description.toLowerCase();
        const assets = [];
        if (lower.includes('api'))
            assets.push({ type: 'URL', value: 'https://api.example.com' });
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
    mockProposal(proposal) {
        const trimmed = proposal.trim();
        return {
            suggestionsOnly: true,
            improved: `${trimmed}\n\n---\nSuggested additions:\n- Methodology\n- Deliverables`,
            hints: ['Methodology', 'Deliverables'],
        };
    }
    mockRiskClassification(input) {
        const text = `${input.title} ${input.description}`.toLowerCase();
        let label = client_1.ReportSeverity.MEDIUM;
        if (text.includes('rce') || text.includes('critical') || text.includes('auth bypass')) {
            label = client_1.ReportSeverity.CRITICAL;
        }
        else if (text.includes('sql') || text.includes('xss') || text.includes('high')) {
            label = client_1.ReportSeverity.HIGH;
        }
        else if (text.includes('info') || text.includes('low')) {
            label = client_1.ReportSeverity.LOW;
        }
        return {
            label,
            rationale: 'Heuristic mock severity (set OPENAI_API_KEY for live triage).',
        };
    }
    mockReview(input) {
        const missing = [];
        if (input.title.length < 8)
            missing.push('Expand title');
        if (input.description.length < 80)
            missing.push('Add reproduction steps');
        return {
            suggestionsOnly: true,
            completeness: missing.length === 0 ? 'Likely sufficient' : 'Likely incomplete',
            missingFields: missing,
            checklist: ['Asset?', 'Impact?'],
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService, Object])
], AiService);
//# sourceMappingURL=ai.service.js.map