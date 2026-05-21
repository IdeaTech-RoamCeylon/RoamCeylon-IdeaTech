// apps/backend/src/modules/ml/services/db-optimization.service.ts
//
// Provides runtime database query analysis and table statistics for ML tables.
// Exposed via GET /api/ml/db/stats for operational observability.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableStat {
  tableName: string;
  estimatedRowCount: number;
  totalSizeBytes: number;
  indexSizeBytes: number;
  tableSizeBytes: number;
}

interface SlowQuerySample {
  endpoint: string;
  method: string;
  avgDurationMs: number;
  maxDurationMs: number;
  sampleCount: number;
}

export interface DbStats {
  generatedAt: string;
  tableStats: TableStat[];
  slowestEndpoints: SlowQuerySample[];
  recommendedIndexes: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DbOptimizationService {
  private readonly logger = new Logger(DbOptimizationService.name);

  // Indexes recommended for ML module tables
  private readonly RECOMMENDED_INDEXES = [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recommendation_log_user_id ON "RecommendationLog" ("userId");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planner_event_type_ts ON "PlannerEvent" ("eventType", "timestamp");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_behavior_event_user ON "UserBehaviorEvent" ("userId");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interest_profile_user ON "UserInterestProfile" ("userId");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_destination_category_score_dest ON "DestinationCategoryScore" ("destinationId");',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getDbStats(): Promise<DbStats> {
    const [tableStats, slowestEndpoints] = await Promise.all([
      this.getTableStats(),
      this.getSlowestEndpoints(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      tableStats,
      slowestEndpoints,
      recommendedIndexes: this.RECOMMENDED_INDEXES,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async getTableStats(): Promise<TableStat[]> {
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          table_name: string;
          row_estimate: string;
          total_bytes: string;
          index_bytes: string;
          table_bytes: string;
        }>
      >`
        SELECT
          relname                                   AS table_name,
          reltuples::BIGINT                         AS row_estimate,
          pg_total_relation_size(c.oid)::BIGINT     AS total_bytes,
          pg_indexes_size(c.oid)::BIGINT            AS index_bytes,
          pg_relation_size(c.oid)::BIGINT           AS table_bytes
        FROM pg_class c
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE relkind = 'r'
          AND n.nspname = 'public'
          AND relname IN (
            'RecommendationLog',
            'UserBehaviorEvent',
            'UserInterestProfile',
            'DestinationCategoryScore',
            'PlannerEvent',
            'SystemMetric'
          )
        ORDER BY pg_total_relation_size(c.oid) DESC
      `;

      return rows.map((row) => ({
        tableName: row.table_name,
        estimatedRowCount: Number(row.row_estimate),
        totalSizeBytes: Number(row.total_bytes),
        indexSizeBytes: Number(row.index_bytes),
        tableSizeBytes: Number(row.table_bytes),
      }));
    } catch (err) {
      this.logger.warn(
        `[DbOptimization] getTableStats failed: ${(err as Error).message}`,
      );
      return [];
    }
  }

  private async getSlowestEndpoints(): Promise<SlowQuerySample[]> {
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          endpoint: string;
          method: string;
          avg_ms: number;
          max_ms: number;
          sample_count: string;
        }>
      >`
        SELECT
          metadata->>'endpoint'                                    AS endpoint,
          metadata->>'method'                                      AS method,
          ROUND(
            CAST(AVG(CAST(metadata->>'durationMs' AS FLOAT)) AS NUMERIC), 2
          )                                                        AS avg_ms,
          ROUND(
            CAST(MAX(CAST(metadata->>'durationMs' AS FLOAT)) AS NUMERIC), 2
          )                                                        AS max_ms,
          COUNT(*)                                                 AS sample_count
        FROM "PlannerEvent"
        WHERE "eventType" = 'latency_sample'
          AND "timestamp" >= NOW() - INTERVAL '24 hours'
          AND metadata->>'durationMs' IS NOT NULL
        GROUP BY metadata->>'endpoint', metadata->>'method'
        ORDER BY avg_ms DESC
        LIMIT 10
      `;

      return rows.map((row) => ({
        endpoint: row.endpoint ?? 'unknown',
        method: row.method ?? 'GET',
        avgDurationMs: Number(row.avg_ms),
        maxDurationMs: Number(row.max_ms),
        sampleCount: Number(row.sample_count),
      }));
    } catch (err) {
      this.logger.warn(
        `[DbOptimization] getSlowestEndpoints failed: ${(err as Error).message}`,
      );
      return [];
    }
  }
}
