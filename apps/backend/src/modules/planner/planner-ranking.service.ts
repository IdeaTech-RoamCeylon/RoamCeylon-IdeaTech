import { Injectable, Logger } from '@nestjs/common';
import {
  PlannerAggregationService,
  FeedbackAggregation,
} from './planner-aggregation.service';

/**
 * Weight adjustment result
 */
export interface WeightAdjustment {
  baseScore: number;
  feedbackWeight: number; // -0.3 to +0.3
  adjustedScore: number;
  meetsThreshold: boolean; // true if >= 3 ratings
  reason: string; // explanation of adjustment
}

/**
 * Service for ranking with controlled weight adjustment
 * Implements Day 46 Task 2: Controlled Weight Adjustment
 */
@Injectable()
export class PlannerRankingService {
  private readonly logger = new Logger(PlannerRankingService.name);
  private readonly MINIMUM_RATING_THRESHOLD = 3;
  private readonly MAX_WEIGHT_ADJUSTMENT = 0.3;
  private readonly MIN_WEIGHT_ADJUSTMENT = -0.3;

  constructor(private readonly aggregationService: PlannerAggregationService) {}

  /**
   * Calculate weight adjustment for a trip based on feedback
   *
   * Rules:
   * - Minimum 3 ratings required for weight adjustment
   * - Weight ranges from -0.3 (all negative) to +0.3 (all positive)
   * - Linear interpolation based on positive ratio
   */
  async calculateTripWeight(
    tripId: string,
    baseScore: number = 1.0,
  ): Promise<WeightAdjustment> {
    const aggregation =
      await this.aggregationService.aggregateTripFeedback(tripId);

    return this.applyWeightAdjustment(baseScore, aggregation, 'trip');
  }

  /**
   * Calculate weight adjustment for a destination
   */
  async calculateDestinationWeight(
    destination: string,
    baseScore: number = 1.0,
  ): Promise<WeightAdjustment> {
    const aggregation =
      await this.aggregationService.aggregateByDestination(destination);

    const feedbackAggregation: FeedbackAggregation = {
      totalFeedback: aggregation.totalFeedback,
      positiveCount: aggregation.positiveCount,
      negativeCount: aggregation.negativeCount,
      averageRating: aggregation.averageRating,
      hasMinimumThreshold: aggregation.hasMinimumThreshold,
    };

    return this.applyWeightAdjustment(
      baseScore,
      feedbackAggregation,
      'destination',
    );
  }

  /**
   * Calculate weight adjustment for a category
   */
  async calculateCategoryWeight(
    category: string,
    baseScore: number = 1.0,
  ): Promise<WeightAdjustment> {
    const aggregation =
      await this.aggregationService.aggregateByCategory(category);

    return this.applyWeightAdjustment(baseScore, aggregation, 'category');
  }

  /**
   * Apply weight adjustment based on aggregation data
   */
  private applyWeightAdjustment(
    baseScore: number,
    aggregation: FeedbackAggregation,
    type: string,
  ): WeightAdjustment {
    // Check threshold
    if (aggregation.totalFeedback < this.MINIMUM_RATING_THRESHOLD) {
      return {
        baseScore,
        feedbackWeight: 0,
        adjustedScore: baseScore,
        meetsThreshold: false,
        reason: `Insufficient feedback (${aggregation.totalFeedback}/${this.MINIMUM_RATING_THRESHOLD} required)`,
      };
    }

    // Calculate positive ratio
    const totalWithRatings =
      aggregation.positiveCount + aggregation.negativeCount;
    const positiveRatio =
      totalWithRatings > 0 ? aggregation.positiveCount / totalWithRatings : 0.5;

    // Linear interpolation: 0% positive = -0.3, 50% = 0, 100% = +0.3
    // Formula: weight = (positiveRatio - 0.5) * 2 * MAX_WEIGHT
    let feedbackWeight = (positiveRatio - 0.5) * 2 * this.MAX_WEIGHT_ADJUSTMENT;

    // Clamp to prevent extreme values
    feedbackWeight = Math.max(
      this.MIN_WEIGHT_ADJUSTMENT,
      Math.min(this.MAX_WEIGHT_ADJUSTMENT, feedbackWeight),
    );

    const adjustedScore = baseScore + feedbackWeight;

    const reason = this.generateReason(
      aggregation,
      positiveRatio,
      feedbackWeight,
      type,
    );

    this.logger.debug(
      `Weight adjustment for ${type}: base=${baseScore}, weight=${feedbackWeight.toFixed(3)}, adjusted=${adjustedScore.toFixed(3)}`,
    );

    return {
      baseScore,
      feedbackWeight: Number(feedbackWeight.toFixed(3)),
      adjustedScore: Number(adjustedScore.toFixed(3)),
      meetsThreshold: true,
      reason,
    };
  }

  /**
   * Generate human-readable reason for weight adjustment
   */
  private generateReason(
    aggregation: FeedbackAggregation,
    positiveRatio: number,
    weight: number,
    type: string,
  ): string {
    const percentPositive = (positiveRatio * 100).toFixed(0);
    const direction =
      weight > 0 ? 'increased' : weight < 0 ? 'decreased' : 'unchanged';
    const sentiment =
      positiveRatio >= 0.7
        ? 'highly positive'
        : positiveRatio >= 0.5
          ? 'mostly positive'
          : positiveRatio >= 0.3
            ? 'mixed'
            : 'mostly negative';

    return `Based on ${aggregation.totalFeedback} ratings (${percentPositive}% positive, avg ${aggregation.averageRating.toFixed(1)}/5), ${type} ranking ${direction} by ${Math.abs(weight).toFixed(2)} (${sentiment} feedback)`;
  }

  /**
   * Batch calculate weights for multiple trips
   * Useful for ranking multiple trip suggestions
   */
  async calculateBatchWeights(
    tripIds: string[],
    baseScore: number = 1.0,
  ): Promise<Map<string, WeightAdjustment>> {
    const results = new Map<string, WeightAdjustment>();

    // Use Promise.all for parallel processing
    const adjustments = await Promise.all(
      tripIds.map(async (tripId) => ({
        tripId,
        adjustment: await this.calculateTripWeight(tripId, baseScore),
      })),
    );

    for (const { tripId, adjustment } of adjustments) {
      results.set(tripId, adjustment);
    }

    return results;
  }

  /**
   * Sort trips by adjusted scores
   */
  async sortTripsByFeedback(
    trips: Array<{ id: string; baseScore?: number }>,
  ): Promise<
    Array<{ id: string; score: number; adjustment: WeightAdjustment }>
  > {
    const scoredTrips = await Promise.all(
      trips.map(async (trip) => {
        const adjustment = await this.calculateTripWeight(
          trip.id,
          trip.baseScore || 1.0,
        );
        return {
          id: trip.id,
          score: adjustment.adjustedScore,
          adjustment,
        };
      }),
    );

    // Sort by adjusted score (descending)
    return scoredTrips.sort((a, b) => b.score - a.score);
  }
}
