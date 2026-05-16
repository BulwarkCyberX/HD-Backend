import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(
    pinoHttp({
      level: process.env.LOG_LEVEL ?? 'info',
      autoLogging: process.env.NODE_ENV !== 'test',
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: webOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
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
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

bootstrap();
