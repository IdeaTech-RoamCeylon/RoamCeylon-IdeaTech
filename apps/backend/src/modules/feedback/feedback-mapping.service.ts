// apps/backend/src/modules/feedback/feedback-mapping.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedbackMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main entry point
   * Validates rating then recalculates trust score
   */
  async processFeedback(
    userId: string, 
    tripId: string, 
    feedback: { rating: number; },
  ): Promise<void> {
    const { rating } = feedback;

    if (rating < 1 || rating > 5) {
      throw new BadRequestException(
        'Feedback rating must be between 1 and 5',
      );
    }

    await this.recalculateTrustScore(userId);
  }

  /**
   * Recalculate trustScore using:
   * - Exponential time decay
   * - Proper positive & negative weighting
   * - Bayesian smoothing
   */
  private async recalculateTrustScore(userId: string): Promise<void> {
    const feedbacks = await this.prisma.plannerFeedback.findMany({
      where: { userId },
      select: {
        feedbackValue: true,
        createdAt: true,
      },
    });

    /**
     * If no feedback exists → reset trust to neutral
     */
    if (feedbacks.length === 0) {
      await this.prisma.userFeedbackSignal.upsert({
        where: { userId },
        create: {
          userId,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          trustScore: 0.5,
        },
        update: {
          trustScore: 0.5,
        },
      });
      return;
    }

    const now = new Date();

    /**
     * Decay factor (smaller = slower decay)
     * 0.02 → feedback halves roughly every ~35 days
     */
    const DECAY_LAMBDA = 0.02;

    let weightedPositive = 0;
    let weightedNegative = 0;
    let weightedNeutral = 0;
    let weightedTotal = 0;

    for (const fb of feedbacks) {
      if (typeof fb.feedbackValue !== 'number') continue;

      const daysOld =
        (now.getTime() - new Date(fb.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);

      const decayWeight = Math.exp(-DECAY_LAMBDA * daysOld);

      const signal = this.mapRatingToSignal(fb.feedbackValue);

      if (signal === 1) {
        weightedPositive += decayWeight;
      } else if (signal === -1) {
        weightedNegative += decayWeight;
      } else if (signal === 0) 
        weightedNeutral += decayWeight;

      weightedTotal += decayWeight;
    }

    /**
     * Bayesian smoothing (prevents extreme trust at low data)
     * PRIOR acts as virtual balanced feedback
     */
    const PRIOR = 2;

    const trustScore =
      (weightedPositive + PRIOR) /
      (weightedPositive + weightedNegative + PRIOR * 2);

    /**
     * Clamp for safety (0–1)
     */
    const safeTrust = Math.max(0, Math.min(trustScore, 1));

    await this.prisma.userFeedbackSignal.upsert({
      where: { userId },
      create: {
        userId,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        trustScore: safeTrust,
      },
      update: {
        trustScore: safeTrust,
      },
    });
  }

  /**
   * Rating → signal mapping
   *
   * 1–2 → -1
   * 3   → 0
   * 4–5 → +1
   */
  private mapRatingToSignal(rating: number): number {
    if (rating >= 4) return 1;
    if (rating <= 2) return -1;
    return 0;
  }
}
