import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { wrapMail } from './templates/mail-layout';
import { EMAIL_TEMPLATE_DEFAULTS } from './templates/email-template.defaults';

export function interpolateTemplate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key];
    return val === undefined || val === null ? '' : String(val);
  });
}

@Injectable()
export class EmailTemplateService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaults();
  }

  async ensureDefaults() {
    for (const def of EMAIL_TEMPLATE_DEFAULTS) {
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

  async getByKey(key: string) {
    const row = await this.prisma.emailTemplate.findUnique({ where: { key } });
    if (!row) throw new NotFoundException(`Email template not found: ${key}`);
    return row;
  }

  async update(
    key: string,
    input: {
      subject?: string;
      title?: string;
      preheader?: string | null;
      innerHtml?: string;
      textBody?: string;
      name?: string;
      description?: string;
      updatedById?: string;
    },
  ) {
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

  async render(key: string, vars: Record<string, string | number>) {
    const tpl = await this.getByKey(key);
    const subject = interpolateTemplate(tpl.subject, vars);
    const title = interpolateTemplate(tpl.title, vars);
    const preheader = tpl.preheader ? interpolateTemplate(tpl.preheader, vars) : undefined;
    const innerHtml = interpolateTemplate(tpl.innerHtml, vars);
    const text = interpolateTemplate(tpl.textBody, vars);
    const html = wrapMail({ title, preheader, innerHtml });
    return { subject, html, text };
  }

  async preview(key: string, vars: Record<string, string | number>) {
    return this.render(key, vars);
  }

  sampleVariables(key: string): Record<string, string> {
    const samples: Record<string, Record<string, string>> = {
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
}
