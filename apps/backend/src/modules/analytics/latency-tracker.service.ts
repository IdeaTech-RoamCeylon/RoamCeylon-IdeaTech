// apps/backend/src/modules/analytics/latency-tracker.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LatencyRecord {
  endpoint: string;
  method: string;
  durationMs: number;
  statusCode?: number;
  userId?: string;
}

export interface PercentileStats {
  endpoint: string;
  method: string;
  sampleCount: number;
  p50Ms: number; // median — 50% of requests are faster than this
  p95Ms: number; // 95% of requests are faster than this
  p99Ms: number; // 99% of requests are faster than this
  avgMs: number; // average (kept for comparison)
  maxMs: number; // absolute worst case
  minMs: number; // absolute best case
  windowHours: number;
}

export interface LatencyReport {
  generatedAt: string;
  windowHours: number;
  totalSamples: number;
  endpoints: PercentileStats[];
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    reason?: string;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class LatencyTrackerService {
  private readonly logger = new Logger(LatencyTrackerService.name);

  // P99 thresholds in ms — tune these for your SLA
  private readonly THRESHOLDS = {
    TRIP_PLAN: { P95_WARN: 3000, P99_CRITICAL: 8000 },
    FEEDBACK: { P95_WARN: 500, P99_CRITICAL: 2000 },
    SEARCH: { P95_WARN: 1000, P99_CRITICAL: 3000 },
    DEFAULT: { P95_WARN: 2000, P99_CRITICAL: 5000 },
  };

  constructor(private readonly prisma: PrismaService) {}

  // ─── Record a latency sample ────────────────────────────────────────────────

  /**
   * Records a latency sample into PlannerEvent.
   * Call this at the end of any endpoint you want to track.
   * Non-blocking — errors are caught and logged only.
   */
  async record(record: LatencyRecord): Promise<void> {
    try {
      await this.prisma.plannerEvent.create({
        data: {
          userId: record.userId,
          eventType: 'latency_sample',
          metadata: {
            endpoint: record.endpoint,
            method: record.method,
            durationMs: record.durationMs,
            statusCode: record.statusCode ?? 200,
          },
          timestamp: new Date(),
        },
      });
    } catch (err) {
      // Non-blocking — latency tracking must never break the main flow
      this.logger.error(
        `[LatencyTracker] Failed to record sample for ${record.method} ${record.endpoint}: ${(err as Error).message}`,
      );
    }
  }

  // ─── Compute percentiles ────────────────────────────────────────────────────

  /**
   * Computes P50, P95, P99, avg, min, max for all tracked endpoints
   * within the given time window using PostgreSQL's percentile_cont function.
   *
   * percentile_cont is an ordered-set aggregate function — it interpolates
   * between values for non-integer percentile positions, which gives more
   * accurate results than simple array indexing.
   */
  async getLatencyReport(windowHours: number = 24): Promise<LatencyReport> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    // ── Step 1: Get all samples in the window ────────────────────────────────
    const rawSamples = await this.prisma.$queryRaw<
      Array<{
        endpoint: string;
        method: string;
        duration_ms: number;
      }>
    >`
      SELECT
        metadata->>'endpoint'              AS endpoint,
        metadata->>'method'                AS method,
        CAST(metadata->>'durationMs' AS FLOAT) AS duration_ms
      FROM "PlannerEvent"
      WHERE "eventType" = 'latency_sample'
        AND "timestamp" >= ${since}
        AND metadata->>'durationMs' IS NOT NULL
      ORDER BY
        metadata->>'endpoint',
        metadata->>'method',
        CAST(metadata->>'durationMs' AS FLOAT)
    `;

    if (rawSamples.length === 0) {
      return {
        generatedAt: new Date().toISOString(),
        windowHours,
        totalSamples: 0,
        endpoints: [],
        systemHealth: { status: 'healthy' },
      };
    }

    // ── Step 2: Compute percentiles per endpoint using SQL ───────────────────
    const percentileRows = await this.prisma.$queryRaw<
      Array<{
        endpoint: string;
        method: string;
        sample_count: string | number;
        p50_ms: number;
        p95_ms: number;
        p99_ms: number;
        avg_ms: number;
        max_ms: number;
        min_ms: number;
      }>
    >`
      SELECT
        metadata->>'endpoint'                                              AS endpoint,
        metadata->>'method'                                                AS method,
        COUNT(*)                                                           AS sample_count,
        ROUND(
          CAST(
            percentile_cont(0.50) WITHIN GROUP (
              ORDER BY CAST(metadata->>'durationMs' AS FLOAT)
            ) AS NUMERIC
          ), 2
        )                                                                  AS p50_ms,
        ROUND(
          CAST(
            percentile_cont(0.95) WITHIN GROUP (
              ORDER BY CAST(metadata->>'durationMs' AS FLOAT)
            ) AS NUMERIC
          ), 2
        )                                                                  AS p95_ms,
        ROUND(
          CAST(
            percentile_cont(0.99) WITHIN GROUP (
              ORDER BY CAST(metadata->>'durationMs' AS FLOAT)
            ) AS NUMERIC
          ), 2
        )                                                                  AS p99_ms,
        ROUND(
          CAST(
            AVG(CAST(metadata->>'durationMs' AS FLOAT)) AS NUMERIC
          ), 2
        )                                                                  AS avg_ms,
        ROUND(
          CAST(
            MAX(CAST(metadata->>'durationMs' AS FLOAT)) AS NUMERIC
          ), 2
        )                                                                  AS max_ms,
        ROUND(
          CAST(
            MIN(CAST(metadata->>'durationMs' AS FLOAT)) AS NUMERIC
          ), 2
        )                                                                  AS min_ms
      FROM "PlannerEvent"
      WHERE "eventType" = 'latency_sample'
        AND "timestamp" >= ${since}
        AND metadata->>'durationMs' IS NOT NULL
      GROUP BY
        metadata->>'endpoint',
        metadata->>'method'
      ORDER BY
        metadata->>'endpoint'
    `;

    // ── Step 3: Map to typed output ──────────────────────────────────────────
    const endpoints: PercentileStats[] = percentileRows.map((row) => ({
      endpoint: row.endpoint ?? 'unknown',
      method: row.method ?? 'GET',
      sampleCount: Number(row.sample_count),
      p50Ms: Number(row.p50_ms),
      p95Ms: Number(row.p95_ms),
      p99Ms: Number(row.p99_ms),
      avgMs: Number(row.avg_ms),
      maxMs: Number(row.max_ms),
      minMs: Number(row.min_ms),
      windowHours,
    }));

    // ── Step 4: Determine system health from P99 thresholds ──────────────────
    const systemHealth = this.evaluateSystemHealth(endpoints);

    return {
      generatedAt: new Date().toISOString(),
      windowHours,
      totalSamples: rawSamples.length,
      endpoints,
      systemHealth,
    };
  }

  // ─── Trend analysis ─────────────────────────────────────────────────────────

  /**
   * Returns hourly P95 latency trend for a specific endpoint.
   * Useful for spotting degradation over time.
   */
  async getLatencyTrend(
    endpoint: string,
    windowHours: number = 24,
  ): Promise<
    Array<{ hour: string; p95Ms: number; p99Ms: number; sampleCount: number }>
  > {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<
      Array<{
        hour: string;
        p95_ms: number;
        p99_ms: number;
        sample_count: string | number;
      }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('hour', "timestamp"), 'YYYY-MM-DD HH24:00') AS hour,
        ROUND(
          CAST(
            percentile_cont(0.95) WITHIN GROUP (
              ORDER BY CAST(metadata->>'durationMs' AS FLOAT)
            ) AS NUMERIC
          ), 2
        ) AS p95_ms,
        ROUND(
          CAST(
            percentile_cont(0.99) WITHIN GROUP (
              ORDER BY CAST(metadata->>'durationMs' AS FLOAT)
            ) AS NUMERIC
          ), 2
        ) AS p99_ms,
        COUNT(*) AS sample_count
      FROM "PlannerEvent"
      WHERE "eventType" = 'latency_sample'
        AND "timestamp" >= ${since}
        AND metadata->>'endpoint' = ${endpoint}
        AND metadata->>'durationMs' IS NOT NULL
      GROUP BY DATE_TRUNC('hour', "timestamp")
      ORDER BY DATE_TRUNC('hour', "timestamp")
    `;

    return rows.map((row) => ({
      hour: row.hour,
      p95Ms: Number(row.p95_ms),
      p99Ms: Number(row.p99_ms),
      sampleCount: Number(row.sample_count),
    }));
  }

  // ─── Health evaluation ──────────────────────────────────────────────────────

  private evaluateSystemHealth(
    endpoints: PercentileStats[],
  ): LatencyReport['systemHealth'] {
    const violations: string[] = [];

    for (const ep of endpoints) {
      const key = this.getThresholdKey(ep.endpoint);
      const threshold = this.THRESHOLDS[key];

      if (ep.p99Ms > threshold.P99_CRITICAL) {
        violations.push(
          `${ep.method} ${ep.endpoint} P99=${ep.p99Ms}ms exceeds critical threshold ${threshold.P99_CRITICAL}ms`,
        );
      } else if (ep.p95Ms > threshold.P95_WARN) {
        violations.push(
          `${ep.method} ${ep.endpoint} P95=${ep.p95Ms}ms exceeds warning threshold ${threshold.P95_WARN}ms`,
        );
      }
    }

    if (violations.some((v) => v.includes('critical'))) {
      return { status: 'critical', reason: violations.join('; ') };
    }
    if (violations.length > 0) {
      return { status: 'degraded', reason: violations.join('; ') };
    }
    return { status: 'healthy' };
  }

  private getThresholdKey(endpoint: string): keyof typeof this.THRESHOLDS {
    if (endpoint.includes('trip-plan')) return 'TRIP_PLAN';
    if (endpoint.includes('feedback')) return 'FEEDBACK';
    if (endpoint.includes('search')) return 'SEARCH';
    return 'DEFAULT';
  }

  // ─── Helper: measure and record in one call ─────────────────────────────────

  /**
   * Convenience wrapper — times an async operation and records the result.
   *
   * Usage:
   *   const result = await this.latencyTracker.measure(
   *     { endpoint: '/ai/trip-plan', method: 'POST', userId },
   *     () => this.generateItinerary(...)
   *   );
   */
  async measure<T>(
    record: Omit<LatencyRecord, 'durationMs'>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = process.hrtime.bigint();
    let statusCode = 200;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      statusCode = 500;
      throw err;
    } finally {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      void this.record({ ...record, durationMs, statusCode });
    }
  }
}
