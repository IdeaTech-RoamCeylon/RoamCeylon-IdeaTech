// apps/backend/src/modules/feedback/aggregation-validator.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AggregationValidationResult {
  userId?: string;
  feedbackCount: number;
  computedTrustScore: number | null;
  storedTrustScore: number | null;
  isDuplicate: boolean;
  isCorrupted: boolean;
  discrepancyDetected: boolean;
  issues: string[];
}

export interface SystemAggregationReport {
  totalFeedbacks: number;
  uniqueUserTripPairs: number;
  duplicatesDetected: number;
  corruptedEntries: number;
  usersWithDiscrepancy: number;
  validatedAt: string;
}

@Injectable()
export class AggregationValidatorService {
  private readonly logger = new Logger(AggregationValidatorService.name);

  // Maximum allowed discrepancy between computed and stored trust scores
  private readonly TRUST_SCORE_TOLERANCE = 0.01;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates feedback aggregation for a specific user.
   * Checks accuracy of trust score computation and absence of duplicates.
   */
  async validateUserAggregation(
    userId: string,
  ): Promise<AggregationValidationResult> {
    const issues: string[] = [];

    const feedbacks = await this.prisma.plannerFeedback.findMany({
      where: { userId },
      select: {
        userId: true,
        tripId: true,
        feedbackValue: true,
        createdAt: true,
      },
    });

    // Check for duplicates (should not exist due to unique constraint, but verify)
    const tripIds = feedbacks.map((f) => f.tripId);
    const uniqueTripIds = new Set(tripIds);
    const isDuplicate = tripIds.length !== uniqueTripIds.size;

    if (isDuplicate) {
      issues.push(
        `Duplicate feedback detected: ${tripIds.length} entries for ${uniqueTripIds.size} unique trips`,
      );
      this.logger.error(
        `[AggregationValidator] Duplicate feedback for user=${userId}`,
      );
    }

    // Verify trust score by recomputing it
    const storedSignal = await this.prisma.userFeedbackSignal.findUnique({
      where: { userId },
    });

    let computedTrustScore: number | null = null;

    if (feedbacks.length > 0) {
      const DECAY_LAMBDA = 0.02;
      const PRIOR = 2;
      const now = new Date();

      let weightedPositive = 0;
      let weightedNegative = 0;

      for (const fb of feedbacks) {
        const value = fb.feedbackValue as { rating?: number };
        if (!value?.rating) continue;

        const daysOld =
          (now.getTime() - fb.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const decayWeight = Math.exp(-DECAY_LAMBDA * daysOld);

        if (value.rating >= 4) {
          weightedPositive += decayWeight;
        } else if (value.rating <= 2) {
          weightedNegative += decayWeight;
        }
      }

      const rawTrust =
        (weightedPositive + PRIOR) /
        (weightedPositive + weightedNegative + PRIOR * 2);

      computedTrustScore = Math.max(0, Math.min(rawTrust, 1));
    }

    // Check for corrupted entries (missing rating field)
    const corruptedEntries = feedbacks.filter((fb) => {
      const value = fb.feedbackValue as { rating?: unknown };
      return !value?.rating || typeof value.rating !== 'number';
    });

    const isCorrupted = corruptedEntries.length > 0;

    if (isCorrupted) {
      issues.push(
        `${corruptedEntries.length} corrupted feedback entries (missing/invalid rating)`,
      );
      this.logger.error(
        `[AggregationValidator] Corrupted entries for user=${userId}: ${corruptedEntries.length}`,
      );
    }

    // Check trust score discrepancy
    const storedTrustScore = storedSignal?.trustScore ?? null;
    let discrepancyDetected = false;

    if (
      computedTrustScore !== null &&
      storedTrustScore !== null &&
      Math.abs(computedTrustScore - storedTrustScore) >
        this.TRUST_SCORE_TOLERANCE
    ) {
      discrepancyDetected = true;
      issues.push(
        `Trust score discrepancy: computed=${computedTrustScore.toFixed(4)}, stored=${storedTrustScore.toFixed(4)}`,
      );
      this.logger.warn(
        `[AggregationValidator] Trust score discrepancy for user=${userId}: computed=${computedTrustScore.toFixed(4)}, stored=${storedTrustScore.toFixed(4)}`,
      );
    }

    if (issues.length === 0) {
      this.logger.log(
        `[AggregationValidator] User ${userId} passed aggregation validation (${feedbacks.length} feedbacks)`,
      );
    }

    return {
      userId,
      feedbackCount: feedbacks.length,
      computedTrustScore,
      storedTrustScore,
      isDuplicate,
      isCorrupted,
      discrepancyDetected,
      issues,
    };
  }

  /**
   * Run a system-wide aggregation accuracy check.
   */
  async runSystemValidation(): Promise<SystemAggregationReport> {
    this.logger.log(
      '[AggregationValidator] Running system-wide aggregation validation...',
    );

    const [totalFeedbacks, uniquePairsResult] = await Promise.all([
      this.prisma.plannerFeedback.count(),
      this.prisma.plannerFeedback.groupBy({
        by: ['userId', 'tripId'],
        _count: true,
      }),
    ]);

    const uniqueUserTripPairs = uniquePairsResult.length;
    const duplicatesDetected = totalFeedbacks - uniqueUserTripPairs;

    // Count corrupted feedback entries (no valid rating)
    const allFeedbacks = await this.prisma.plannerFeedback.findMany({
      select: { feedbackValue: true },
    });

    const corruptedEntries = allFeedbacks.filter((fb) => {
      const value = fb.feedbackValue as { rating?: unknown };
      return !value?.rating || typeof value.rating !== 'number';
    }).length;

    // Sample random users to check for discrepancies
    const sampleUsers = await this.prisma.plannerFeedback.findMany({
      distinct: ['userId'],
      take: 20,
      select: { userId: true },
    });

    let usersWithDiscrepancy = 0;
    for (const { userId } of sampleUsers) {
      const result = await this.validateUserAggregation(userId);
      if (result.discrepancyDetected) {
        usersWithDiscrepancy++;
      }
    }

    const report: SystemAggregationReport = {
      totalFeedbacks,
      uniqueUserTripPairs,
      duplicatesDetected,
      corruptedEntries,
      usersWithDiscrepancy,
      validatedAt: new Date().toISOString(),
    };

    this.logger.log(
      `[AggregationValidator] System validation complete: ${JSON.stringify(report)}`,
    );

    return report;
  }
}
