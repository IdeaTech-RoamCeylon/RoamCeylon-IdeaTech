// apps/backend/src/modules/analytics/analytics.middleware.ts

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AnalyticsMiddleware.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, url } = req;
    const userId = (req as Request & { user?: { id?: string } }).user?.id;
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const isError = statusCode >= 400;

      // Determine event category
      const eventType = isError ? 'api_error' : 'api_call';
      const category = this.resolveCategory(url);

      const metadata = {
        method,
        url,
        statusCode,
        responseTimeMs: responseTime,
        isError,
        isSlowRequest: responseTime > 500,
      };

      // Log the API call for observability
      this.logger.log(
        `[Analytics] ${method} ${url} → ${statusCode} (${responseTime}ms)${isError ? ' ⚠️ ERROR' : ''}${responseTime > 500 ? ' 🐢 SLOW' : ''}`,
      );

      // Persist analytics event (non-blocking — fire and forget)
      this.analyticsService
        .recordEvent(category, eventType, userId, metadata)
        .catch((err: unknown) => {
          this.logger.error(
            `[Analytics] Failed to persist event: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    });

    next();
  }

  private resolveCategory(url: string): 'planner' | 'feedback' | 'system' {
    if (url.startsWith('/planner')) return 'planner';
    if (url.startsWith('/feedback')) return 'feedback';
    return 'system';
  }
}
