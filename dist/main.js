"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const pino_http_1 = __importDefault(require("pino-http"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    app.use((0, pino_http_1.default)({
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: process.env.NODE_ENV !== 'test',
        redact: ['req.headers.authorization', 'req.headers.cookie'],
    }));
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    app.enableCors({
        origin: webOrigin.split(',').map((o) => o.trim()),
        credentials: true,
    });
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('HackersDeal API')
        .setDescription('Enterprise cybersecurity marketplace API — Phase 1 launch surface')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
        .addTag('v1', 'Public API (API key)')
        .addTag('integrations', 'API keys & webhooks')
        .addTag('auth', 'Authentication & sessions')
        .addTag('projects', 'Projects & workspace')
        .addTag('payments', 'Escrow, PSP checkout, ledger')
        .addTag('disputes', 'Dispute resolution')
        .addTag('organizations', 'Client organizations')
        .addTag('admin', 'Platform administration')
        .addTag('public', 'Guest discovery')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = Number(process.env.PORT ?? 4000);
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map