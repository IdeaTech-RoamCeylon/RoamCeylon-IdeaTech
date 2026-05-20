// apps/backend/src/common/interceptors/timeout.interceptor.ts
//
// Global timeout interceptor with per-endpoint tuning.
//
// Timeouts by route category:
//   AI routes    → 60s  (vector search + LLM calls)
//   ML recommend → 5s   (target < 500ms; 5s is the absolute ceiling)
//   Default      → 30s
//
// Also adds X-Request-Timeout response header so clients know the limit.

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import type { Response } from 'express';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    const response = context.switchToHttp().getResponse<Response>();

    const url = request?.url ?? '';

    // Pick timeout based on route
    let timeoutValue: number;

    if (url.includes('/ai/')) {
      timeoutValue = 60_000; // AI/LLM routes need more time
    } else if (url.includes('/recommendations/personalized')) {
      timeoutValue = 5_000; // [Day 66 / Task 1] Tight SLA for ML endpoint
    } else {
      timeoutValue = 30_000; // Safe default for all other routes
    }

    // Inform the client of the active timeout ceiling
    try {
      response.setHeader('X-Request-Timeout', `${timeoutValue}ms`);
    } catch {
      // Header setting can fail on already-sent responses — safe to ignore
    }

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err as Error);
      }),
    );
  }
}
