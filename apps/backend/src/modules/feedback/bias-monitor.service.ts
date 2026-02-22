// apps/backend/src/modules/feedback/bias-monitor.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BiasReport {
  userId: string;
  suppressedCategories: string[]; // categories with weight < 0.6
  overWeightedCategories: string[]; // categories with weight > 1.8
  trustScore: number;
  isFlagged: boolean;
  reason: string[];
}

@Injectable()
export class BiasMonitorService {
  private readonly logger = new Logger(BiasMonitorService.name);

  // Thresholds for bias detection
  private readonly SUPPRESSION_THRESHOLD = 0.6; // extreme category suppression
  private readonly OVER_WEIGHT_THRESHOLD = 1.8; // over-weighted signals
  private readonly LOW_TRUST_THRESHOLD = 0.2;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detect bias signals for a specific user.
   * Called after feedback processing to check for problematic patterns.
   */
  async detectUserBias(userId: string): Promise<BiasReport> {
    const [categoryWeights, userSignal] = await Promise.all([
      this.prisma.userCategoryWeight.findMany({
        where: { userId },
      }),
      this.prisma.userFeedbackSignal.findUnique({
        where: { userId },
      }),
    ]);

    const suppressedCategories: string[] = [];
    const overWeightedCategories: string[] = [];
    const reasons: string[] = [];

    for (const cw of categoryWeights) {
      if (cw.weight < this.SUPPRESSION_THRESHOLD) {
        suppressedCategories.push(cw.category);
        this.logger.warn(
          `[BiasMonitor] Extreme suppression detected for user=${userId}, category=${cw.category}, weight=${cw.weight.toFixed(3)}`,
        );
      }
      if (cw.weight > this.OVER_WEIGHT_THRESHOLD) {
        overWeightedCategories.push(cw.category);
        this.logger.warn(
          `[BiasMonitor] Over-weighted signal detected for user=${userId}, category=${cw.category}, weight=${cw.weight.toFixed(3)}`,
        );
      }
    }

    const trustScore = userSignal?.trustScore ?? 0.5;

    if (suppressedCategories.length > 0) {
      reasons.push(
        `Suppressed categories (weight < ${this.SUPPRESSION_THRESHOLD}): ${suppressedCategories.join(', ')}`,
      );
    }
    if (overWeightedCategories.length > 0) {
      reasons.push(
        `Over-weighted categories (weight > ${this.OVER_WEIGHT_THRESHOLD}): ${overWeightedCategories.join(', ')}`,
      );
    }
    if (trustScore < this.LOW_TRUST_THRESHOLD) {
      reasons.push(
        `Low trust score: ${trustScore.toFixed(3)} (threshold < ${this.LOW_TRUST_THRESHOLD})`,
      );
    }

    const isFlagged = reasons.length > 0;

    if (isFlagged) {
      this.logger.warn(
        `[BiasMonitor] User ${userId} flagged for bias: ${reasons.join(' | ')}`,
      );
    }

    return {
      userId,
      suppressedCategories,
      overWeightedCategories,
      trustScore,
      isFlagged,
      reason: reasons,
    };
  }

  /**
   * Run a system-wide bias scan across all users.
   * Returns users flagged for bias issues.
   */
  async runSystemBiasScan(): Promise<BiasReport[]> {
    this.logger.log('[BiasMonitor] Starting system-wide bias scan...');

    // Find all users with extreme category weights
    const extremeWeights = await this.prisma.userCategoryWeight.findMany({
      where: {
        OR: [
          { weight: { lt: this.SUPPRESSION_THRESHOLD } },
          { weight: { gt: this.OVER_WEIGHT_THRESHOLD } },
        ],
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const flaggedUserIds = extremeWeights.map((ew) => ew.userId);

    const reports: BiasReport[] = [];

    for (const userId of flaggedUserIds) {
      const report = await this.detectUserBias(userId);
      if (report.isFlagged) {
        reports.push(report);
      }
    }

    this.logger.log(
      `[BiasMonitor] Scan complete. Flagged ${reports.length} user(s) out of ${flaggedUserIds.length} candidates.`,
    );

    return reports;
  }

  /**
   * Get bias summary stats across all users (for admin/monitoring).
   */
  async getBiasSummaryStats() {
    const [suppressedCount, overWeightedCount, totalWeights] =
      await Promise.all([
        this.prisma.userCategoryWeight.count({
          where: { weight: { lt: this.SUPPRESSION_THRESHOLD } },
        }),
        this.prisma.userCategoryWeight.count({
          where: { weight: { gt: this.OVER_WEIGHT_THRESHOLD } },
        }),
        this.prisma.userCategoryWeight.count(),
      ]);

    return {
      totalCategoryWeights: totalWeights,
      suppressedCount,
      overWeightedCount,
      suppressionRate:
        totalWeights > 0
          ? ((suppressedCount / totalWeights) * 100).toFixed(2) + '%'
          : '0%',
      overWeightRate:
        totalWeights > 0
          ? ((overWeightedCount / totalWeights) * 100).toFixed(2) + '%'
          : '0%',
      thresholds: {
        suppressionBelow: this.SUPPRESSION_THRESHOLD,
        overWeightAbove: this.OVER_WEIGHT_THRESHOLD,
      },
    };
  }
}
