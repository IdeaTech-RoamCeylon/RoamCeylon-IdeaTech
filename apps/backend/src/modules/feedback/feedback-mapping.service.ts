// apps/backend/src/modules/feedback/feedback-mapping.service.ts

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedbackMappingService {
  private readonly logger = new Logger(FeedbackMappingService.name);

  // ==============================
  // CONTROLLED LEARNING CONSTANTS
  private readonly DECAY_LAMBDA = 0.025;
  private readonly PRIOR = 2;

  private readonly CATEGORY_DELTA = 0.1;
  private readonly CATEGORY_MIN = 0.5;
  private readonly CATEGORY_MAX = 2;
  private readonly MIN_FEEDBACK_FOR_CATEGORY_LEARNING = 3;

  constructor(private readonly prisma: PrismaService) {}

  // ==============================
  // ENTRY POINT
  // ==============================

  async processFeedback(
    userId: string,
    rating: number,
    category?: string,
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    this.logger.log(
      `[LearningMetrics] Processing feedback: userId=${userId}, rating=${rating}, category=${category ?? 'none'}`,
    );

    // IMPORTANT: Trust should reflect the new feedback
    await this.recalculateTrustScore(userId);

    if (category) {
      await this.updateCategoryWeight(userId, category, rating);
    }
  }

  // ==============================
  // TRUST SCORE (Decay + Bayesian)
  // ==============================

  private async recalculateTrustScore(userId: string): Promise<void> {
    const feedbacks = await this.prisma.plannerFeedback.findMany({
      where: { userId },
      select: { feedbackValue: true, createdAt: true },
    });

    if (feedbacks.length === 0) {
      await this.prisma.userFeedbackSignal.upsert({
        where: { userId },
        create: { userId, trustScore: 0.5 },
        update: { trustScore: 0.5 },
      });
      return;
    }

    const now = new Date();

    let weightedPositive = 0;
    let weightedNegative = 0;

    // Raw counts for display in UserFeedbackSignal.
    // Recalculated from scratch each time to stay accurate
    // even when old feedback is edited (upsert replaces rating).
    // Ratings: 4-5 = positive, 1-2 = negative, 3 = neutral
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const fb of feedbacks) {
      const rating = this.extractRating(fb.feedbackValue);
      if (rating === undefined) continue;

      const daysOld =
        (now.getTime() - fb.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      const decayWeight = Math.exp(-this.DECAY_LAMBDA * daysOld);

      if (rating >= 4) {
        weightedPositive += decayWeight;
        positiveCount++;
      } else if (rating <= 2) {
        weightedNegative += decayWeight;
        negativeCount++;
      } else {
        // rating === 3 → neutral
        neutralCount++;
      }
    }

    const trustScore =
      (weightedPositive + this.PRIOR) /
      (weightedPositive + weightedNegative + this.PRIOR * 2);

    const safeTrust = Math.max(0, Math.min(trustScore, 1));

    this.logger.log(
      `[LearningMetrics] TrustScore recalculated for ${userId}: ` +
        `positive=${positiveCount}, negative=${negativeCount}, neutral=${neutralCount}, ` +
        `trustScore=${safeTrust.toFixed(4)}`,
    );

    await this.prisma.userFeedbackSignal.upsert({
      where: { userId },
      create: {
        userId,
        trustScore: safeTrust,
        positiveCount,
        negativeCount,
        neutralCount,
      },
      update: {
        trustScore: safeTrust,
        positiveCount,
        negativeCount,
        neutralCount,
      },
    });
  }

  // ==============================
  // CATEGORY LEARNING (STRICT & SAFE)
  // ==============================

  private async updateCategoryWeight(
    userId: string,
    category: string,
    rating: number,
  ): Promise<void> {
    const existing = await this.prisma.userCategoryWeight.findUnique({
      where: { userId_category: { userId, category } },
    });

    // Initialize record if missing
    if (!existing) {
      await this.prisma.userCategoryWeight.create({
        data: {
          userId,
          category,
          weight: 1, // neutral
          feedbackCount: 1,
        },
      });
      return;
    }

    const newFeedbackCount = existing.feedbackCount + 1;

    // Still below learning threshold → only count
    if (feedbackCount < this.MIN_FEEDBACK_FOR_CATEGORY_LEARNING) {
      await this.prisma.userCategoryWeight.update({
        where: { userId_category: { userId, category } },
        data: { feedbackCount: newFeedbackCount },
      });
      return;
    }

    // Learning starts after threshold
    let delta = 0;

    if (rating >= 4) delta = this.CATEGORY_DELTA;
    else if (rating <= 2) delta = -this.CATEGORY_DELTA;

    // Neutral rating (3) does not change weight
    const updatedWeight = this.clamp(
      existing.weight + delta,
      this.CATEGORY_MIN,
      this.CATEGORY_MAX,
    );

    await this.prisma.userCategoryWeight.update({
      where: { userId_category: { userId, category } },
      data: {
        weight: updatedWeight,
        feedbackCount: newFeedbackCount,
      },
    });
  }

  // ==============================
  // UTILITIES
  // ==============================

  private extractRating(raw: unknown): number | undefined {
    if (typeof raw === 'number') return raw;

    if (raw && typeof raw === 'object' && raw !== null && 'rating' in raw) {
      const rating = (raw as { rating?: unknown }).rating;
      if (typeof rating === 'number') return rating;
    }

    return undefined;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }

  private clamp01(value: number): number {
    return this.clamp(value, 0, 1);
  }
}
