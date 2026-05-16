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
var AiTriageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTriageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ai_service_1 = require("./ai.service");
let AiTriageService = AiTriageService_1 = class AiTriageService {
    constructor(prisma, ai) {
        this.prisma = prisma;
        this.ai = ai;
        this.logger = new common_1.Logger(AiTriageService_1.name);
    }
    async runForReport(reportId, actorUserId) {
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
        if (!report)
            return null;
        const hints = await this.buildHints(report, actorUserId);
        const updated = await this.prisma.report.update({
            where: { id: reportId },
            data: { aiTriageHints: hints },
            select: { id: true, aiTriageHints: true },
        });
        return updated.aiTriageHints;
    }
    async buildHints(report, actorUserId) {
        const [risk, review, duplicate] = await Promise.all([
            this.ai.classifyRisk({ title: report.title, description: report.description }, actorUserId),
            this.ai.reviewReport({ title: report.title, description: report.description, severity: report.severity }, actorUserId),
            this.findDuplicateHint(report, actorUserId),
        ]);
        const suggestedSeverity = this.mapSeverityLabel(String(risk.label ?? risk['label'] ?? ''));
        const reviewObj = review;
        const missingFields = Array.isArray(reviewObj.missingFields)
            ? reviewObj.missingFields
            : [];
        const checklist = Array.isArray(reviewObj.checklist) ? reviewObj.checklist : [];
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
    async findDuplicateHint(report, actorUserId) {
        const peers = await this.prisma.report.findMany({
            where: { projectId: report.projectId, id: { not: report.id } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, title: true, description: true },
        });
        if (peers.length === 0)
            return null;
        let best = null;
        for (const peer of peers) {
            try {
                const hint = (await this.ai.duplicateHint(`${report.title}\n${report.description}`, `${peer.title}\n${peer.description}`, actorUserId));
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
                if (likely && score >= 0.75)
                    break;
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.warn(`Duplicate hint failed for report ${report.id}: ${message}`);
            }
        }
        return best;
    }
    mapSeverityLabel(label) {
        const u = label.toUpperCase();
        if (u === 'LOW' || u === 'MEDIUM' || u === 'HIGH' || u === 'CRITICAL') {
            return u;
        }
        return null;
    }
};
exports.AiTriageService = AiTriageService;
exports.AiTriageService = AiTriageService = AiTriageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], AiTriageService);
//# sourceMappingURL=ai-triage.service.js.map