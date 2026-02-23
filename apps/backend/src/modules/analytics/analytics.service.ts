// apps/backend/src/modules/analytics/analytics.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record an analytics event to the appropriate table.
   */
  async recordEvent(
    category: 'planner' | 'feedback' | 'system',
    eventType: string,
    userId?: string,

    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      if (category === 'planner') {
        await this.prisma.plannerEvent.create({
          data: { userId, eventType, metadata },
        });
      } else if (category === 'feedback') {
        await this.prisma.feedbackEvent.create({
          data: { userId, eventType, metadata },
        });
      } else {
        await this.prisma.systemMetric.create({
          data: { userId, eventType, metadata },
        });
      }
    } catch (err) {
      this.logger.error(
        `[Analytics] Failed to record ${category}/${eventType}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ============================================================
  // Aggregation Queries
  // ============================================================

  /**
   * GET /analytics/planner/daily
   * Returns planner event counts grouped by eventType for today.
   */
  async getPlannerDailyStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [events, totalEvents, plannerEventsData] = await Promise.all([
      this.prisma.plannerEvent.groupBy({
        by: ['eventType'],
        _count: { id: true },
        where: { timestamp: { gte: startOfDay } },
      }),
      this.prisma.plannerEvent.count({
        where: { timestamp: { gte: startOfDay } },
      }),
      this.prisma.plannerEvent.findMany({
        where: {
          eventType: 'planner_generated',
          timestamp: { gte: startOfDay },
        },
        select: { metadata: true },
      }),
    ]);

    let totalDuration = 0;
    let durationCount = 0;

    for (const e of plannerEventsData) {
      const md = e.metadata as Record<string, any>;
      if (typeof md?.durationMs === 'number') {
        totalDuration += md.durationMs;
        durationCount++;
      }
    }

    const avgResponseTimeMs =
      durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalEvents,
      avgResponseTimeMs,
      breakdown: events.map((e) => ({
        eventType: e.eventType,
        count: e._count.id,
      })),
    };
  }

  /**
   * GET /analytics/feedback/rate
   * Returns feedback submission rate: total submissions and avg per day.
   */
  async getFeedbackRate() {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalFeedbacks, recentEventsData] = await Promise.all([
      this.prisma.plannerFeedback.count(),
      this.prisma.feedbackEvent.findMany({
        where: { timestamp: { gte: last7Days } },
        select: { eventType: true, metadata: true },
      }),
    ]);

    const recentEventsCount = recentEventsData.length;
    const avgPerDay = recentEventsCount / 7;

    let positiveCount = 0;
    let submittedCount = 0;

    for (const e of recentEventsData) {
      if (e.eventType === 'feedback_submitted') {
        submittedCount++;
        const md = e.metadata as Record<string, any>;
        if (typeof md?.rating === 'number' && md.rating >= 4) {
          positiveCount++;
        }
      }
    }

    const positiveFeedbackPercentage =
      submittedCount > 0
        ? parseFloat(((positiveCount / submittedCount) * 100).toFixed(1))
        : 0;

    // Group by day for breakdown
    const dailyBreakdown = await this.prisma.feedbackEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
      where: { timestamp: { gte: last7Days } },
    });

    return {
      totalFeedbacksAllTime: totalFeedbacks,
      last7DaysEvents: recentEventsCount,
      avgFeedbackEventsPerDay: parseFloat(avgPerDay.toFixed(2)),
      positiveFeedbackPercentage,
      breakdown: dailyBreakdown.map((d) => ({
        eventType: d.eventType,
        count: d._count.id,
      })),
    };
  }

  /**
   * GET /analytics/system/errors
   * Returns error counts from system metrics in the last 24 hours.
   */
  async getSystemErrors() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const errors = await this.prisma.systemMetric.findMany({
      where: {
        eventType: 'api_error',
        timestamp: { gte: last24h },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
      select: {
        id: true,
        eventType: true,
        metadata: true,
        timestamp: true,
      },
    });

    const errorCount = await this.prisma.systemMetric.count({
      where: {
        eventType: 'api_error',
        timestamp: { gte: last24h },
      },
    });

    const totalRequests = await this.prisma.systemMetric.count({
      where: { timestamp: { gte: last24h } },
    });

    const errorRate =
      totalRequests > 0
        ? parseFloat(((errorCount / totalRequests) * 100).toFixed(2))
        : 0;

    return {
      period: 'last_24h',
      totalRequests,
      errorCount,
      errorRate: `${errorRate}%`,
      recentErrors: errors,
    };
  }
}
