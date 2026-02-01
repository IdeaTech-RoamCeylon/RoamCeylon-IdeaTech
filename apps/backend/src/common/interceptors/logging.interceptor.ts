import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'Unknown';
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse<Response>();
          const statusCode = response.statusCode;
          const duration = Date.now() - now;

          this.logger.log(
            `[${className}#${handlerName}] ${method} ${url} ${statusCode} - ${duration}ms | IP: ${ip} | UA: ${userAgent}`,
          );

          // Log heavy requests or large payloads in debug mode or if they take too long
          if (duration > 500) {
            this.logger.warn(`🚲 Slow Request: ${method} ${url} took ${duration}ms`);
          }
        },
        error: (err: unknown) => {
          const duration = Date.now() - now;
          const statusCode = err instanceof Error && 'status' in err ? (err as any).status || 500 : 500;
          const message = err instanceof Error ? err.message : String(err);
          const stack = err instanceof Error ? err.stack : '';

          this.logger.error(
            `[${className}#${handlerName}] ${method} ${url} ${statusCode} - ${duration}ms | Error: ${message}`,
            stack,
          );
        },
      }),
    );
  }
}
