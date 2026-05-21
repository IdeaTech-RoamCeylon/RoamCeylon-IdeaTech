// apps/backend/src/common/interceptors/request-id.interceptor.ts
//
// Attaches a unique X-Request-ID to every request/response pair.
//
// Behaviour:
//   - If the client sends X-Request-ID, it is forwarded unchanged (correlation).
//   - If no ID is provided, a new one is generated: req_<timestamp>_<random>.
//   - The ID is stored on `request['requestId']` so downstream handlers,
//     services, and the AllExceptionsFilter can all reference it.
//   - The ID is echoed back in the X-Request-ID response header.

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { requestId?: string }>();
    const response = http.getResponse<Response>();

    // Honour client-supplied ID for distributed tracing; generate otherwise
    const requestId =
      (request.headers['x-request-id'] as string | undefined) ??
      `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Make it available to all downstream code
    request.requestId = requestId;

    // Echo it back so clients can correlate responses to their requests
    response.setHeader('X-Request-ID', requestId);

    return next.handle();
  }
}
