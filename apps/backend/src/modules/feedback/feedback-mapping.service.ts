// apps/backend/src/modules/feedback/feedback-mapping.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedbackMappingService {
  private readonly logger = new Logger(FeedbackMappingService.name);
  private readonly DECAY_LAMBDA = 0.02;
  private readonly PRIOR = 2;

  constructor(private readonly prisma: PrismaService) {}

  async processFeedback(
    userId: string,
    tripId: string,
    rating: number,
    category?: string,
  ): Promise<void> {
    this.logger.log(
      `[LearningMetrics] Processing feedback: userId=${userId}, tripId=${tripId}, rating=${rating}, category=${category ?? 'none'}`,
    );

    await Promise.all([
      this.recalculateTrustScore(userId),
      category ? this.updateCategoryWeight(userId, tripId, rating) : null,
    ]);
  }

  // =============================
  // TRUST SCORE
  // =============================

  private async recalculateTrustScore(userId: string): Promise<void> {
    const feedbacks = await this.prisma.plannerFeedback.findMany({
      where: { userId },
      select: {
        feedbackValue: true,
        createdAt: true,
      },
    });

    if (feedbacks.length === 0) {
      await this.prisma.userFeedbackSignal.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
      return;
    }

    const now = new Date();

    let weightedPositive = 0;
    let weightedNegative = 0;
    let neutralCount = 0;

    for (const fb of feedbacks) {
      // feedbackValue may be stored as {rating: N} (new) or bare number (legacy)
      const raw = fb.feedbackValue;
      const ratingVal =
        raw !== null && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as { rating?: number }).rating
          : typeof raw === 'number'
            ? raw
            : undefined;

      if (!ratingVal) continue;

      const daysOld =
        (now.getTime() - fb.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      const decayWeight = Math.exp(-this.DECAY_LAMBDA * daysOld);

      if (ratingVal >= 4) {
        weightedPositive += decayWeight;
      } else if (ratingVal <= 2) {
        weightedNegative += decayWeight;
      } else {
        neutralCount++;
      }
    }

    const trustScore =
      (weightedPositive + this.PRIOR) /
      (weightedPositive + weightedNegative + this.PRIOR * 2);

    const safeTrust = Math.max(0, Math.min(trustScore, 1));

    this.logger.log(
      `[LearningMetrics] Trust score update: userId=${userId}, positiveWeight=${weightedPositive.toFixed(3)}, negativeWeight=${weightedNegative.toFixed(3)}, computedTrust=${safeTrust.toFixed(4)}, feedbackCount=${feedbacks.length}`,
    );

    await this.prisma.userFeedbackSignal.upsert({
      where: { userId },
      create: {
        userId,
        positiveCount: Math.round(weightedPositive),
        negativeCount: Math.round(weightedNegative),
        neutralCount,
        trustScore: safeTrust,
      },
      update: {
        positiveCount: Math.round(weightedPositive),
        negativeCount: Math.round(weightedNegative),
        neutralCount,
        trustScore: safeTrust,
      },
    });
  }

  // =============================
  // CATEGORY WEIGHT
  // =============================

  private async updateCategoryWeight(
    userId: string,
    category: string,
    rating: number,
  ) {
    const existing = await this.prisma.userCategoryWeight.findUnique({
      where: {
        userId_category: { userId, category },
      },
    });

    const delta = rating >= 4 ? 0.1 : rating <= 2 ? -0.1 : 0;

    if (!existing) {
      await this.prisma.userCategoryWeight.create({
        data: {
          userId,
          category,
          weight: 1 + delta,
          feedbackCount: 1,
        },
      });
      return;
    }

    const newWeight = Math.max(0.5, Math.min(existing.weight + delta, 2));

    this.logger.log(
      `[LearningMetrics] Category weight update: userId=${userId}, category=${category}, oldWeight=${existing.weight.toFixed(3)}, delta=${delta}, newWeight=${newWeight.toFixed(3)}, feedbackCount=${existing.feedbackCount + 1}`,
    );

    await this.prisma.userCategoryWeight.update({
      where: {
        userId_category: { userId, category },
      },
      data: {
        weight: newWeight,
        feedbackCount: existing.feedbackCount + 1,
      },
    });
  }
}
