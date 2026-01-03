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
<<<<<<< HEAD
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const request = ctx.getRequest();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const response = ctx.getResponse();
=======
        const request = ctx.getRequest(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        const response = ctx.getResponse(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
>>>>>>> 898217e90996383118021d6edfd1547aed2fc103

        return next.handle().pipe(
            map((data: unknown) => {
                // Handle pagination metadata if present in data (convention: data.data and data.meta)
                // If data has 'data' and 'meta' properties, unpack them.
                let finalData = data as T;
                let meta: any = undefined;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    const dataObj = data as Record<string, unknown>;
                    if ('data' in dataObj && 'meta' in dataObj) {
                        finalData = dataObj.data as T;
                        meta = dataObj.meta;
                    }
                }

                return {
<<<<<<< HEAD
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    statusCode: response.statusCode,
                    success: true,
                    timestamp: new Date().toISOString(),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    path: request.url,
=======
                    statusCode: Number(response.statusCode), // Ensure number
                    success: true,
                    timestamp: new Date().toISOString(),
                    path: String(request.url), // Ensure string
>>>>>>> 898217e90996383118021d6edfd1547aed2fc103
                    data: finalData,
                    meta,
                };
            }),
        );
    }
}
