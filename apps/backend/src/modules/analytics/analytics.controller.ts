// apps/backend/src/modules/analytics/analytics.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import {
  LatencyTrackerService,
  LatencyReport,
} from './latency-tracker.service';

@Controller('analytics')
@UseInterceptors(CacheInterceptor)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly latencyTracker: LatencyTrackerService,
  ) {}

  /**
   * GET /analytics/planner/daily
   * Returns planner event counts for today, grouped by event type.
   */
  @Get('planner/daily')
  @CacheTTL(60000) // 1 minute
  async getPlannerDailyStats() {
    return this.analyticsService.getPlannerDailyStats();
  }

  /**
   * GET /analytics/feedback/rate
   * Returns feedback submission rate and 7-day breakdown.
   */
  @Get('feedback/rate')
  @CacheTTL(60000) // 1 minute
  async getFeedbackRate() {
    return this.analyticsService.getFeedbackRate();
  }

  /**
   * GET /analytics/system/errors
   * Returns system error count and error rate for the last 24 hours.
   */
  @Get('system/errors')
  @CacheTTL(60000) // 1 minute
  async getSystemErrors() {
    return this.analyticsService.getSystemErrors();
  }

  /**
   * GET /analytics/system/health
   * Returns system health including latency and error rates.
   */
  @Get('system/health')
  @CacheTTL(60000) // 1 minute
  async getSystemHealth() {
    return this.analyticsService.getSystemHealth();
  }

  /**
   * GET /analytics/ai/performance
   * Exposes AI performance metrics for dashboard:
   *   - Avg planner generation time
   *   - Feedback influence rate
   *   - Ranking adjustment %
   *
   * @param days - look-back window in days (default: 7, max: 90)
   *
   * Example:
   *   GET /analytics/ai/performance
   *   GET /analytics/ai/performance?days=30
   */
  @Get('ai/performance')
  @CacheTTL(120000) // 2 minutes — slightly longer since AI metrics are less time-sensitive
  async getAIPerformance(@Query('days') days?: string) {
    const parsedDays = Number(days);
    const lookbackDays =
      Number.isInteger(parsedDays) && parsedDays > 0
        ? Math.min(parsedDays, 90)
        : 7;

    return this.analyticsService.getAIPerformanceMetrics(lookbackDays);
  }

  /**
   * GET /analytics/latency
   *
   * Returns P50, P95, P99 latency for all tracked endpoints.
   *
   * Query params:
   *   ?window=24   — time window in hours (default: 24)
   *
   * Example response:
   * {
   *   "generatedAt": "2026-03-18T10:00:00.000Z",
   *   "windowHours": 24,
   *   "totalSamples": 142,
   *   "systemHealth": { "status": "healthy" },
   *   "endpoints": [
   *     {
   *       "endpoint": "/ai/trip-plan",
   *       "method": "POST",
   *       "sampleCount": 38,
   *       "p50Ms": 412,
   *       "p95Ms": 1840,
   *       "p99Ms": 3200,
   *       "avgMs": 520,
   *       "maxMs": 4100,
   *       "minMs": 180
   *     }
   *   ]
   * }
   */
  @Get('latency')
  async getLatencyReport(
    @Query('window') window?: string,
  ): Promise<LatencyReport> {
    const windowHours = window
      ? Math.min(Math.max(Number(window) || 24, 1), 168)
      : 24;
    return this.latencyTracker.getLatencyReport(windowHours);
  }

  /**
   * GET /analytics/latency/trend
   *
   * Returns hourly P95/P99 trend for a specific endpoint.
   * Useful for spotting gradual degradation.
   *
   * Query params:
   *   ?endpoint=/ai/trip-plan   — endpoint path (required)
   *   ?window=24                — hours to look back (default: 24)
   */
  @Get('latency/trend')
  async getLatencyTrend(
    @Query('endpoint') endpoint: string,
    @Query('window') window?: string,
  ): Promise<{
    endpoint: string;
    trend: Array<{
      hour: string;
      p95Ms: number;
      p99Ms: number;
      sampleCount: number;
    }>;
  }> {
    const windowHours = window
      ? Math.min(Math.max(Number(window) || 24, 1), 168)
      : 24;
    const trend = await this.latencyTracker.getLatencyTrend(
      endpoint,
      windowHours,
    );
    return { endpoint, trend };
  }
  /**
   * POST /analytics/events
   * Receives a client-side engagement event (ML training signal).
   * Fire-and-forget — always returns 202 Accepted, never blocks the client.
   */
  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  trackEngagementEvent(
    @Body() body: { event: string; timestamp?: number; [key: string]: unknown },
  ) {
    const { event, timestamp, ...payload } = body;
    // Non-blocking — errors are logged internally, never surfaced
    void this.analyticsService.trackEngagementEvent(event ?? 'unknown', {
      ...payload,
      clientTimestamp: timestamp,
    });
    return { accepted: true };
  }

  /**
   * GET /analytics/events/summary
   * Returns engagement event counts for the last 24 hours,
   * broken down by the 5 canonical ML signal event types.
   */
  @Get('events/summary')
  @CacheTTL(60000) // 1 minute
  async getEngagementStats() {
    return this.analyticsService.getEngagementStats();
  }
}
