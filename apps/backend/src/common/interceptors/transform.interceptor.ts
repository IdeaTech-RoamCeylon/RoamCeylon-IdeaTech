import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    statusCode: number;
    success: true;
    timestamp: string;
    path: string;
    data: T;
    meta?: any;
}

interface HttpServerResponse {
    statusCode: number;
}
interface HttpServerRequest {
    url: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<HttpServerRequest>();
        const response = ctx.getResponse<HttpServerResponse>();

        return next.handle().pipe(
            map((data: unknown) => {
                // Handle pagination metadata if present in data
                let finalData = data as T;
                let meta: unknown = undefined;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    const dataObj = data as Record<string, unknown>;
                    if ('data' in dataObj && 'meta' in dataObj) {
                        finalData = dataObj.data as T;
                        meta = dataObj.meta;
                    }
                }

                return {
                    statusCode: response.statusCode,
                    success: true,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    data: finalData,
                    meta,
                };
            }),
        );
    }
}
