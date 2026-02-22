// apps/backend/src/modules/feedback/feedback-mapping.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedbackMappingService {
  private readonly DECAY_LAMBDA = 0.02;
  private readonly PRIOR = 2;

  constructor(private readonly prisma: PrismaService) {}

  async processFeedback(
    userId: string,
    tripId: string,
    rating: number,
    category?: string,
  ): Promise<void> {
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
      const value = fb.feedbackValue as { rating?: number };

      if (!value?.rating) continue;

      const daysOld =
        (now.getTime() - fb.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      const decayWeight = Math.exp(-this.DECAY_LAMBDA * daysOld);

      if (value.rating >= 4) {
        weightedPositive += decayWeight;
      } else if (value.rating <= 2) {
        weightedNegative += decayWeight;
      } else {
        neutralCount++;
      }
    }

    const trustScore =
      (weightedPositive + this.PRIOR) /
      (weightedPositive + weightedNegative + this.PRIOR * 2);

    const safeTrust = Math.max(0, Math.min(trustScore, 1));

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
