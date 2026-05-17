import { type RequestUser } from '../../auth/current-user.decorator';
import { IntegrationsService } from './integrations.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { PatchWebhookDto } from './dto/patch-webhook.dto';
export declare class IntegrationsController {
    private readonly integrations;
    constructor(integrations: IntegrationsService);
    listApiKeys(user: RequestUser): Promise<{
        id: string;
        createdAt: Date;
        lastUsedAt: Date | null;
        label: string;
        keyPrefix: string;
        scopes: string[];
    }[]>;
    createApiKey(user: RequestUser, dto: CreateApiKeyDto): Promise<{
        apiKey: string;
        keyPrefix: string;
        label: string;
        scopes: ("read" | "write:reports")[];
    }>;
    revokeApiKey(user: RequestUser, id: string): Promise<{
        ok: boolean;
    }>;
    listWebhooks(user: RequestUser): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            deliveries: number;
        };
        label: string;
        events: import(".prisma/client").$Enums.WebhookEventType[];
        enabled: boolean;
    }[]>;
    createWebhook(user: RequestUser, dto: CreateWebhookDto): Promise<{
        signingSecret: string;
        url: string;
        id: string;
        createdAt: Date;
        label: string;
        events: import(".prisma/client").$Enums.WebhookEventType[];
        enabled: boolean;
    }>;
    patchWebhook(user: RequestUser, id: string, dto: PatchWebhookDto): Promise<{
        id: string;
        label: string;
        enabled: boolean;
    }>;
    deleteWebhook(user: RequestUser, id: string): Promise<{
        ok: boolean;
    }>;
    listDeliveries(user: RequestUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        event: import(".prisma/client").$Enums.WebhookEventType;
        statusCode: number | null;
        success: boolean;
        errorMessage: string | null;
    }[]>;
    testWebhook(user: RequestUser, id: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    retryDelivery(user: RequestUser, deliveryId: string): Promise<{
        ok: boolean;
        message: string;
    }>;
}
