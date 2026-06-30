import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Graceful shutdown ────────────────────────────────────────────────────
  // Allows NestJS lifecycle hooks (OnModuleDestroy) to run on SIGTERM/SIGINT
  // so Docker/Kubernetes can drain in-flight requests cleanly.
  app.enableShutdownHooks();

  // ── Exception filter ─────────────────────────────────────────────────────
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // ── CORS ─────────────────────────────────────────────────────────────────
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN') ?? '*';

  app.enableCors({
    origin:
      corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // ── Interceptors (order matters — RequestId first so all downstream have it)
  app.useGlobalInterceptors(
    new RequestIdInterceptor(), // 1. Stamp every request with an ID
    new LoggingInterceptor(), // 2. Log with that ID in scope
    new TransformInterceptor(), // 3. Wrap successful responses
    new TimeoutInterceptor(), // 4. Enforce per-route timeouts
  );

  // ── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      transform: true, // Auto-coerce types
      forbidUnknownValues: true, // Reject unknown top-level values
      stopAtFirstError: true, // Return first error only (cleaner response)
    }),
  );

  const port = configService.get<number>('PORT') ?? 3001;

  await app.listen(port, '0.0.0.0');

  logger.log(`\n🚀 Server is running on http://localhost:${port}`);
  logger.log(`📱 Mobile access: http://192.168.8.198:${port}\n`);
}

// ── Unhandled rejection / exception guards ────────────────────────────────────
// These prevent the process from crashing silently on unhandled async errors.

process.on('unhandledRejection', (reason: unknown) => {
  logger.error(
    `Unhandled Promise Rejection`,
    reason instanceof Error ? reason.stack : String(reason),
  );
  // Log-and-continue — don't kill the process for unhandled rejections
  // (they are usually non-fatal background operations like analytics writes)
});

process.on('uncaughtException', (err: Error) => {
  logger.error(
    `Uncaught Exception — process will exit: ${err.message}`,
    err.stack,
  );
  // Graceful exit with error code — orchestrators will restart the container
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.log(
    'SIGTERM received — waiting for in-flight requests to complete...',
  );
  // NestJS enableShutdownHooks() handles the actual shutdown sequence
  // This handler just logs so ops teams can see the signal in logs
});

void bootstrap();
