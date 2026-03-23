// apps/backend/src/common/interceptors/latency-tracking.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { LatencyTrackerService } from '../../modules/analytics/latency-tracker.service';

/**
 * Global interceptor that automatically records latency samples for
 * every HTTP endpoint — no per-endpoint code changes needed.
 *
 * Register globally in main.ts or AppModule so all routes are covered,
 * including any new endpoints added in the future.
 *
 * Records: endpoint path, HTTP method, duration, status code, userId.
 * Skips:   health checks and static assets to avoid noise.
 */
@Injectable()
export class LatencyTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LatencyTrackingInterceptor.name);

  // Endpoints to skip — health checks add noise without signal
  private readonly SKIP_PATHS = new Set([
    '/health',
    '/favicon.ico',
    '/metrics',
  ]);

  constructor(private readonly latencyTracker: LatencyTrackerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<
      Request & { user?: { id?: string; userId?: string } }
    >();
    const response = http.getResponse<Response>();

    const { method, path } = request;

    // Skip noise endpoints
    if (this.SKIP_PATHS.has(path)) {
      return next.handle();
    }

    const startTime = process.hrtime.bigint();

    // Extract userId from JWT guard result if available
    const userId: string | undefined =
      request.user?.id ?? request.user?.userId ?? undefined;

    return next.handle().pipe(
      // ── Success path ──────────────────────────────────────────────
      tap(() => {
        const durationMs =
          Number(process.hrtime.bigint() - startTime) / 1_000_000;
        const statusCode = response.statusCode;

        this.latencyTracker
          .record({ endpoint: path, method, durationMs, statusCode, userId })
          .catch((err: unknown) =>
            this.logger.error(
              `[LatencyInterceptor] Record failed: ${(err as Error).message}`,
            ),
          );
      }),

      // ── Error path ────────────────────────────────────────────────
      catchError((err: unknown) => {
        const durationMs =
          Number(process.hrtime.bigint() - startTime) / 1_000_000;

        // Still record the latency — errors are important for P99!
        // A 500 that takes 8 seconds is exactly what P99 should catch.
        const statusCode =
          err != null &&
          typeof err === 'object' &&
          'status' in err &&
          typeof (err as { status: unknown }).status === 'number'
            ? (err as { status: number }).status
            : 500;

        this.latencyTracker
          .record({ endpoint: path, method, durationMs, statusCode, userId })
          .catch((recordErr: unknown) =>
            this.logger.error(
              `[LatencyInterceptor] Error record failed: ${(recordErr as Error).message}`,
            ),
          );

        return throwError(() => err);
      }),
    );
  }
}
