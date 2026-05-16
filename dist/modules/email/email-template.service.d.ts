import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
export declare function interpolateTemplate(template: string, vars: Record<string, string | number>): string;
export declare class EmailTemplateService implements OnModuleInit {
    private readonly prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    ensureDefaults(): Promise<void>;
    list(): Promise<{
        name: string;
        subject: string;
        category: string;
        id: string;
        key: string;
        description: string;
        title: string;
        preheader: string | null;
        variables: string[];
        updatedAt: Date;
    }[]>;
    getByKey(key: string): Promise<{
        name: string;
        subject: string;
        category: string;
        id: string;
        key: string;
        description: string;
        title: string;
        preheader: string | null;
        innerHtml: string;
        textBody: string;
        variables: string[];
        updatedById: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(key: string, input: {
        subject?: string;
        title?: string;
        preheader?: string | null;
        innerHtml?: string;
        textBody?: string;
        name?: string;
        description?: string;
        updatedById?: string;
    }): Promise<{
        name: string;
        subject: string;
        category: string;
        id: string;
        key: string;
        description: string;
        title: string;
        preheader: string | null;
        innerHtml: string;
        textBody: string;
        variables: string[];
        updatedById: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    render(key: string, vars: Record<string, string | number>): Promise<{
        subject: string;
        html: string;
        text: string;
    }>;
    preview(key: string, vars: Record<string, string | number>): Promise<{
        subject: string;
        html: string;
        text: string;
    }>;
    sampleVariables(key: string): Record<string, string>;
}
