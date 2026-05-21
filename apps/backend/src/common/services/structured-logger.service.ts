// apps/backend/src/common/services/structured-logger.service.ts
//
// Structured logging service — wraps NestJS Logger with:
//   - JSON output in production (machine-readable for Datadog, CloudWatch, etc.)
//   - Human-readable output in development
//   - Consistent fields: level, message, context, requestId, userId, timestamp
//   - logError() — safe wrapper that NEVER throws even if logging itself fails

import { Injectable, Logger, LogLevel } from '@nestjs/common';

export interface LogMeta {
  requestId?: string;
  userId?: string;
  errorCode?: string;
  durationMs?: number;
  [key: string]: unknown;
}

@Injectable()
export class StructuredLoggerService {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  // ── Public API ─────────────────────────────────────────────────────────────

  log(context: string, message: string, meta?: LogMeta): void {
    this.emit('log', context, message, undefined, meta);
  }

  warn(context: string, message: string, meta?: LogMeta): void {
    this.emit('warn', context, message, undefined, meta);
  }

  error(context: string, message: string, err?: unknown, meta?: LogMeta): void {
    this.emit('error', context, message, err, meta);
  }

  debug(context: string, message: string, meta?: LogMeta): void {
    this.emit('debug', context, message, undefined, meta);
  }

  /**
   * Safe error wrapper — catches any internal logging errors so calling code
   * never crashes because of a logging failure.
   */
  logError(
    context: string,
    message: string,
    err?: unknown,
    meta?: LogMeta,
  ): void {
    try {
      this.error(context, message, err, meta);
    } catch {
      // Fallback to console if the logger itself is broken
      console.error(
        `[StructuredLogger] FALLBACK | ${context} | ${message}`,
        err,
      );
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private emit(
    level: LogLevel,
    context: string,
    message: string,
    err?: unknown,
    meta?: LogMeta,
  ): void {
    const nestLogger = new Logger(context);
    const stack = err instanceof Error ? err.stack : undefined;

    if (this.isProduction) {
      // JSON output — one log line per event, easy to parse by log aggregators
      const entry: Record<string, unknown> = {
        level,
        message,
        context,
        timestamp: new Date().toISOString(),
        ...meta,
      };

      if (stack) entry['stack'] = stack;
      if (err instanceof Error) entry['errorMessage'] = err.message;

      const jsonLine = JSON.stringify(entry);

      switch (level) {
        case 'error':
          nestLogger.error(jsonLine, stack);
          break;
        case 'warn':
          nestLogger.warn(jsonLine);
          break;
        case 'debug':
          nestLogger.debug(jsonLine);
          break;
        default:
          nestLogger.log(jsonLine);
      }
    } else {
      // Human-readable development output
      const metaStr =
        meta && Object.keys(meta).length > 0
          ? ` | ${JSON.stringify(meta)}`
          : '';

      switch (level) {
        case 'error':
          nestLogger.error(`${message}${metaStr}`, stack);
          break;
        case 'warn':
          nestLogger.warn(`${message}${metaStr}`);
          break;
        case 'debug':
          nestLogger.debug(`${message}${metaStr}`);
          break;
        default:
          nestLogger.log(`${message}${metaStr}`);
      }
    }
  }
}
