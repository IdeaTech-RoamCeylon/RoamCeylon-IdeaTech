import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Metrics data structure
 */
interface MetricData {
    endpoint: string;
    duration: number;
    timestamp: Date;
    statusCode: number;
}

/**
 * Interceptor for planner-specific performance monitoring
 * Implements Day 46 Task 3: Performance & Stability Check
 */
@Injectable()
export class PlannerMetricsInterceptor implements NestInterceptor {
    private readonly logger = new Logger(PlannerMetricsInterceptor.name);
    private readonly SLOW_QUERY_THRESHOLD = 200; // ms, tighter than global 500ms
    private recentMetrics: MetricData[] = [];
    private readonly MAX_METRICS_MEMORY = 100;

    constructor(private readonly prisma: PrismaService) { }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const request = context.switchToHttp().getRequest();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const response = context.switchToHttp().getResponse();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const endpoint = `${request.method} ${request.url}`;
        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - startTime;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    const statusCode = response.statusCode;

                    // Log slow queries
                    if (duration > this.SLOW_QUERY_THRESHOLD) {
                        this.logger.warn(
                            `⚠️  Slow planner endpoint: ${endpoint} took ${duration}ms`,
                        );
                    }

                    // Store metric in memory (circular buffer)
                    const metric: MetricData = {
                        endpoint,
                        duration,
                        timestamp: new Date(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        statusCode,
                    };

                    this.recentMetrics.push(metric);
                    if (this.recentMetrics.length > this.MAX_METRICS_MEMORY) {
                        this.recentMetrics.shift(); // Remove oldest
                    }

                    // Persist to database for analysis (async, non-blocking)
                    this.persistMetric(metric).catch((err) => {
                        this.logger.error('Failed to persist metric', err);
                    });
                },
                error: (err) => {
                    const duration = Date.now() - startTime;
                    this.logger.error(
                        `Error in ${endpoint} after ${duration}ms`,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        err?.stack,
                    );
                },
            }),
        );
    }

    /**
     * Persist metric to database for long-term analysis
     */
    private async persistMetric(metric: MetricData): Promise<void> {
        try {
            // Use PlannerMetadata table to store metrics
            const key = `metric_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            await (this.prisma as any).plannerMetadata.create({
                data: {
                    key,
                    value: {
                        endpoint: metric.endpoint,
                        duration: metric.duration,
                        timestamp: metric.timestamp.toISOString(),
                        statusCode: metric.statusCode,
                    },
                },
            });
        } catch (error) {
            // Silent fail for metrics persistence - don't affect user requests
            this.logger.debug('Metric persistence skipped', error);
        }
    }

    /**
     * Get performance statistics from recent metrics
     */
    getPerformanceStats(): {
        totalRequests: number;
        averageResponseTime: number;
        slowQueryCount: number;
        endpointBreakdown: Record<string, { count: number; avgDuration: number }>;
    } {
        if (this.recentMetrics.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                slowQueryCount: 0,
                endpointBreakdown: {},
            };
        }

        const totalRequests = this.recentMetrics.length;
        const totalDuration = this.recentMetrics.reduce(
            (sum, m) => sum + m.duration,
            0,
        );
        const averageResponseTime = totalDuration / totalRequests;
        const slowQueryCount = this.recentMetrics.filter(
            (m) => m.duration > this.SLOW_QUERY_THRESHOLD,
        ).length;

        // Endpoint breakdown
        const endpointMap = new Map<
            string,
            { durations: number[]; count: number }
        >();

        for (const metric of this.recentMetrics) {
            if (!endpointMap.has(metric.endpoint)) {
                endpointMap.set(metric.endpoint, { durations: [], count: 0 });
            }
            const data = endpointMap.get(metric.endpoint)!;
            data.durations.push(metric.duration);
            data.count++;
        }

        const endpointBreakdown: Record<
            string,
            { count: number; avgDuration: number }
        > = {};

        for (const [endpoint, data] of endpointMap.entries()) {
            const avgDuration =
                data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length;
            endpointBreakdown[endpoint] = {
                count: data.count,
                avgDuration: Number(avgDuration.toFixed(2)),
            };
        }

        return {
            totalRequests,
            averageResponseTime: Number(averageResponseTime.toFixed(2)),
            slowQueryCount,
            endpointBreakdown,
        };
    }
}
