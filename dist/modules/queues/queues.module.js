"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuesModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let QueuesModule = class QueuesModule {
};
exports.QueuesModule = QueuesModule;
exports.QueuesModule = QueuesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('REDIS_URL') ?? 'redis://127.0.0.1:6379';
                    return {
                        connection: new ioredis_1.default(url, { maxRetriesPerRequest: null }),
                    };
                },
            }),
            bullmq_1.BullModule.registerQueue({ name: 'notifications' }),
            bullmq_1.BullModule.registerQueue({ name: 'emails' }),
            bullmq_1.BullModule.registerQueue({ name: 'files' }),
            bullmq_1.BullModule.registerQueue({ name: 'ai' }),
            bullmq_1.BullModule.registerQueue({ name: 'reports' }),
            bullmq_1.BullModule.registerQueue({ name: 'payouts' }),
        ],
        exports: [bullmq_1.BullModule],
    })
], QueuesModule);
//# sourceMappingURL=queues.module.js.map