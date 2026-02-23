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

    const [events, totalEvents, plannerEventsData, recentResponseEvents] =
      await Promise.all([
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
        this.prisma.plannerEvent.findMany({
          where: { eventType: 'planner_generated' },
          select: { metadata: true },
          orderBy: { timestamp: 'desc' },
          take: 30,
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

    const recentResponseTimes = recentResponseEvents
      .map((e) => (e.metadata as Record<string, any>)?.durationMs)
      .filter((val): val is number => typeof val === 'number')
      .reverse();

    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfDay);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const count = await this.prisma.plannerEvent.count({
        where: {
          eventType: 'planner_generated',
          timestamp: { gte: d, lt: nextD },
        },
      });

      last7Days.push({
        date: d.toISOString().split('T')[0],
        count,
      });
    }

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalEvents,
      avgResponseTimeMs,
      recentResponseTimes,
      last7Days,
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
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const last7DaysDate = new Date(
      startOfDay.getTime() - 6 * 24 * 60 * 60 * 1000,
    );

    const [totalFeedbacks, recentEventsData] = await Promise.all([
      this.prisma.plannerFeedback.count(),
      this.prisma.feedbackEvent.findMany({
        where: { timestamp: { gte: last7DaysDate } },
        select: { eventType: true, metadata: true, timestamp: true },
      }),
    ]);

    const recentEventsCount = recentEventsData.length;
    const avgPerDay = recentEventsCount / 7;

    let positiveCount = 0;
    let submittedCount = 0;

    const ratingDistribution = [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 0 },
    ];

    for (const e of recentEventsData) {
      if (e.eventType === 'feedback_submitted') {
        submittedCount++;
        const md = e.metadata as Record<string, any>;
        if (typeof md?.rating === 'number') {
          const r = Math.min(5, Math.max(1, Math.round(md.rating)));
          ratingDistribution[r - 1].count++;
          if (md.rating >= 4) {
            positiveCount++;
          }
        }
      }
    }

    const positiveFeedbackPercentage =
      submittedCount > 0
        ? parseFloat(((positiveCount / submittedCount) * 100).toFixed(1))
        : 0;

    // Build real last7Days trend array for submission events
    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfDay);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const countForDay = recentEventsData.filter(
        (e) =>
          e.eventType === 'feedback_submitted' &&
          e.timestamp >= d &&
          e.timestamp < nextD,
      ).length;

      last7Days.push({
        date: d.toISOString().split('T')[0],
        count: countForDay,
      });
    }

    return {
      totalFeedbacksAllTime: totalFeedbacks,
      last7DaysEvents: recentEventsCount,
      avgFeedbackEventsPerDay: parseFloat(avgPerDay.toFixed(2)),
      positiveFeedbackPercentage,
      ratingDistribution,
      last7Days,
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
