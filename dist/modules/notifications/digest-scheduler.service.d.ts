import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
export declare class DigestSchedulerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly notifications;
    private readonly logger;
    private timer;
    private lastRunWeekKey;
    constructor(config: ConfigService, notifications: NotificationsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private weekKey;
    private tick;
}
