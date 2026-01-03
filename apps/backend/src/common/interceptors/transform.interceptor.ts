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

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment

        return next.handle().pipe(
<<<<<<< HEAD
            map((data) => {
                // Handle pagination metadata if present in data (convention: data.data and data.meta)
                // If data has 'data' and 'meta' properties, unpack them.
                let finalData = data;
                let meta: any = undefined;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    const dataObj = data as Record<string, unknown>;
                    if ('data' in dataObj && 'meta' in dataObj) {
                        finalData = dataObj.data;
                        meta = dataObj.meta;
=======
            map((data: unknown) => {
                // Handle pagination metadata if present in data
                let finalData = data as T;
                let meta = undefined;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const d = data as any;
                    if ('data' in d && 'meta' in d) {
                        finalData = d.data;
                        meta = d.meta;
>>>>>>> c0e8a27ccb35b5293d35cfdefcf59502b25671b9
                    }
                }

                return {
                    statusCode: response.statusCode, // eslint-disable-line @typescript-eslint/no-unsafe-member-access
                    success: true,
                    timestamp: new Date().toISOString(),
                    path: request.url, // eslint-disable-line @typescript-eslint/no-unsafe-member-access
                    data: finalData,
                    meta,
                };
            }),
        );
    }
}
