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

  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

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
    };

    // Enhanced logging with more context
    const logContext = `${request.method} ${request.url}`;

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${logContext}] Critical Error: ${String(message)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (httpStatus >= 400) {
      this.logger.warn(`[${logContext}] Client Error (${httpStatus}): ${String(message)}`);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
