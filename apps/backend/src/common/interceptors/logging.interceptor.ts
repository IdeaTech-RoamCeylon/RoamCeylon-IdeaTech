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
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const userAgent = request.get('user-agent') || '';
    const { ip, method, path: url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const delay = Date.now() - now;
          this.logger.log(
            `${method} ${url} ${response.statusCode} - ${userAgent} ${ip}: ${delay}ms`,
          );
        },
        error: (err: Error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `${method} ${url} - ${userAgent} ${ip}: ${delay}ms - Error: ${err.message}`,
          );
        },
      }),
    );
  }
}
