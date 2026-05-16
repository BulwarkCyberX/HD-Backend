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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplateService = void 0;
exports.interpolateTemplate = interpolateTemplate;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const mail_layout_1 = require("./templates/mail-layout");
const email_template_defaults_1 = require("./templates/email-template.defaults");
function interpolateTemplate(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const val = vars[key];
        return val === undefined || val === null ? '' : String(val);
    });
}
let EmailTemplateService = class EmailTemplateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        await this.ensureDefaults();
    }
    async ensureDefaults() {
        for (const def of email_template_defaults_1.EMAIL_TEMPLATE_DEFAULTS) {
            await this.prisma.emailTemplate.upsert({
                where: { key: def.key },
                update: {},
                create: {
                    key: def.key,
                    name: def.name,
                    category: def.category,
                    description: def.description,
                    subject: def.subject,
                    title: def.title,
                    preheader: def.preheader ?? null,
                    innerHtml: def.innerHtml,
                    textBody: def.textBody,
                    variables: def.variables,
                },
            });
        }
    }
    async list() {
        await this.ensureDefaults();
        return this.prisma.emailTemplate.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                key: true,
                name: true,
                category: true,
                description: true,
                subject: true,
                title: true,
                preheader: true,
                variables: true,
                updatedAt: true,
            },
        });
    }
    async getByKey(key) {
        const row = await this.prisma.emailTemplate.findUnique({ where: { key } });
        if (!row)
            throw new common_1.NotFoundException(`Email template not found: ${key}`);
        return row;
    }
    async update(key, input) {
        await this.getByKey(key);
        return this.prisma.emailTemplate.update({
            where: { key },
            data: {
                subject: input.subject,
                title: input.title,
                preheader: input.preheader,
                innerHtml: input.innerHtml,
                textBody: input.textBody,
                name: input.name,
                description: input.description,
                updatedById: input.updatedById,
            },
        });
    }
    async render(key, vars) {
        const tpl = await this.getByKey(key);
        const subject = interpolateTemplate(tpl.subject, vars);
        const title = interpolateTemplate(tpl.title, vars);
        const preheader = tpl.preheader ? interpolateTemplate(tpl.preheader, vars) : undefined;
        const innerHtml = interpolateTemplate(tpl.innerHtml, vars);
        const text = interpolateTemplate(tpl.textBody, vars);
        const html = (0, mail_layout_1.wrapMail)({ title, preheader, innerHtml });
        return { subject, html, text };
    }
    async preview(key, vars) {
        return this.render(key, vars);
    }
    sampleVariables(key) {
        const samples = {
            SIGNUP_VERIFICATION: {
                firstName: 'Alex',
                email: 'alex@example.com',
                otp: '482910',
                verifyUrl: 'https://app.hackersdeal.com/auth/verify-email/confirm?token=sample',
                expiresHours: '24',
            },
            EMAIL_VERIFIED_WELCOME: {
                firstName: 'Alex',
                loginUrl: 'https://app.hackersdeal.com/auth/login',
            },
            LOGIN_OTP: { code: '123456', ttlMinutes: '10' },
            PASSWORD_RESET: {
                resetUrl: 'https://app.hackersdeal.com/auth/reset-password?token=sample',
                expiresHours: '1',
            },
            PROJECT_CREATED: {
                clientName: 'Alex',
                projectTitle: 'External Web Assessment',
                projectUrl: 'https://app.hackersdeal.com/dashboard/projects/sample',
            },
            BID_PLACED_PROVIDER: {
                providerName: 'Sam',
                projectTitle: 'External Web Assessment',
                amount: '5000',
            },
            NOTIFICATION_GENERIC: {
                heading: 'New bid on your project',
                message: 'A provider submitted a bid on your pentest scope.',
                dashboardUrl: 'https://app.hackersdeal.com/dashboard',
                subject: 'New bid received — HackersDeal',
            },
        };
        return samples[key] ?? {};
    }
};
exports.EmailTemplateService = EmailTemplateService;
exports.EmailTemplateService = EmailTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailTemplateService);
//# sourceMappingURL=email-template.service.js.map