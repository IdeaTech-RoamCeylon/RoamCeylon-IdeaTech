import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    const url = request?.url ?? '';

    // AI endpoints (vector search + OpenAI) need more time than regular API calls
    const isAiRoute = url.includes('/ai/');
    const timeoutValue = isAiRoute ? 60_000 : 30_000;

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError((err: any) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err as Error);
      }),
    );
  }
}
