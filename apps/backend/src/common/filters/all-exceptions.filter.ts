import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';

// ─── Error code mapping ───────────────────────────────────────────────────────

const HTTP_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  410: 'GONE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

function toErrorCode(status: number): string {
  return HTTP_ERROR_CODES[status] ?? `HTTP_ERROR_${status}`;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  // Sensitive field names to redact from logs
  private readonly sensitiveFields = [
    'password',
    'token',
    'authorization',
    'auth',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
    'creditCard',
    'ssn',
  ];

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Sanitize request body by redacting sensitive fields
   */
  private sanitizeObject(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = { ...(obj as Record<string, unknown>) };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();

      const isSensitive = this.sensitiveFields.some((field) =>
        lowerKey.includes(field.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Generate a simple request ID for tracing (fallback if RequestIdInterceptor
   * hasn't set one on the request object yet)
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    // Prefer the ID set by RequestIdInterceptor; fall back to generating one
    const requestId = request.requestId ?? this.generateRequestId();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse as Record<string, unknown>).message
        : exceptionResponse;

    const errorCode = toErrorCode(httpStatus);

    const responseBody = {
      // Consistent envelope — matches TransformInterceptor shape
      success: false,
      error: true,
      statusCode: httpStatus,
      errorCode,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request) as string,
      method: request.method,
      message,
      requestId,
    };

    const logContext = `${request.method} ${request.url}`;
    const sanitizedBody = this.sanitizeObject(request.body);

    if (httpStatus >= 500) {
      // Always log 5xx with full stack trace
      this.logger.error(
        `[${logContext}] [${requestId}] [${errorCode}] Critical Error: ${String(message)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      this.logger.debug(
        `[${requestId}] Request body (sanitized): ${JSON.stringify(sanitizedBody)}`,
      );
    } else if (httpStatus >= 400) {
      this.logger.warn(
        `[${logContext}] [${requestId}] [${errorCode}] Client Error (${httpStatus}): ${String(message)}`,
      );
      this.logger.debug(
        `[${requestId}] Request body (sanitized): ${JSON.stringify(sanitizedBody)}`,
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
