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

  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sanitized = { ...obj };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();

      // Check if key matches sensitive field patterns
      const isSensitive = this.sensitiveFields.some((field) =>
        lowerKey.includes(field.toLowerCase()),
      );

      if (isSensitive) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        sanitized[key] = '***REDACTED***';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (typeof sanitized[key] === 'object') {
        // Recursively sanitize nested objects
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Generate a simple request ID for tracing
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const requestId = this.generateRequestId();

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

    const responseBody = {
      error: true,
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request) as string,
      method: request.method,
      message: message,
      requestId: requestId,
    };

    // Enhanced logging with more context and sensitive data sanitization
    const logContext = `${request.method} ${request.url}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sanitizedBody = this.sanitizeObject(request.body);

    if (httpStatus === (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error(
        `[${logContext}] [${requestId}] Critical Error: ${String(message)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      this.logger.debug(
        `[${requestId}] Request body (sanitized): ${JSON.stringify(sanitizedBody)}`,
      );
    } else if (httpStatus >= 400) {
      this.logger.warn(
        `[${logContext}] [${requestId}] Client Error (${httpStatus}): ${String(message)}`,
      );
      // Only log request body for client errors in debug mode
      if (httpStatus >= 400 && httpStatus < 500) {
        this.logger.debug(
          `[${requestId}] Request body (sanitized): ${JSON.stringify(sanitizedBody)}`,
        );
      }
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
