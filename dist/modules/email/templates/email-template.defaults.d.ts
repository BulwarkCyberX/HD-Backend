export type EmailTemplateDefault = {
    key: string;
    name: string;
    category: string;
    description: string;
    subject: string;
    title: string;
    preheader?: string;
    innerHtml: string;
    textBody: string;
    variables: string[];
};
export declare const EMAIL_TEMPLATE_DEFAULTS: EmailTemplateDefault[];
