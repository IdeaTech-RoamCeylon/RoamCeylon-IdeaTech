import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  success: true;
  timestamp: string;
  path: string;
  requestId?: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface HttpServerResponse {
  statusCode: number;
}
interface HttpServerRequest {
  url: string;
  requestId?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<HttpServerRequest>();
    const response = ctx.getResponse<HttpServerResponse>();

    return next.handle().pipe(
      map((data: unknown) => {
        let finalData = data as T;
        let meta: Record<string, unknown> | undefined = undefined;

        // Unwrap { data, meta } envelopes emitted by paginated endpoints
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const dataObj = data as Record<string, unknown>;
          if ('data' in dataObj && 'meta' in dataObj) {
            finalData = dataObj.data as T;
            // Only include meta if it has actual keys (no empty objects)
            const rawMeta = dataObj.meta as Record<string, unknown> | undefined;
            if (rawMeta && Object.keys(rawMeta).length > 0) {
              meta = rawMeta;
            }
          }
        }

        const envelope: ApiResponse<T> = {
          statusCode: response.statusCode,
          success: true,
          timestamp: new Date().toISOString(),
          path: request.url,
          data: finalData,
        };

        // Attach requestId if RequestIdInterceptor set it
        if (request.requestId) {
          envelope.requestId = request.requestId;
        }

        // Only include meta if non-empty
        if (meta !== undefined) {
          envelope.meta = meta;
        }

        return envelope;
      }),
    );
  }
}
