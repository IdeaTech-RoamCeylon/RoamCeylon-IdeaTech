// apps/backend/src/modules/feedback/feedback-mapping.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';

type TypedPrisma = PrismaClient;

@Injectable()
export class FeedbackMappingService {
  private readonly db: TypedPrisma;

  constructor(private readonly prisma: PrismaService) {
    this.db = prisma as unknown as TypedPrisma;
  }

  async processFeedback(
    userId: string,
    tripId: string,
    feedback: { rating: number },
  ): Promise<void> {
    const { rating } = feedback;

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Feedback rating must be between 1 and 5');
    }

    await this.recalculateTrustScore(userId);
  }

  private async recalculateTrustScore(userId: string): Promise<void> {
    const feedbacks = await this.db.plannerFeedback.findMany({
      where: { userId },
      select: {
        feedbackValue: true,
        createdAt: true,
      },
    });

    if (feedbacks.length === 0) {
      await this.db.userFeedbackSignal.upsert({
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
    const DECAY_LAMBDA = 0.02;

    let weightedPositive = 0;
    let weightedNegative = 0;

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
      }
    }

    const PRIOR = 2;

    const trustScore =
      (weightedPositive + PRIOR) /
      (weightedPositive + weightedNegative + PRIOR * 2);

    const safeTrust = Math.max(0, Math.min(trustScore, 1));

    await this.db.userFeedbackSignal.upsert({
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

  private mapRatingToSignal(rating: number): number {
    if (rating >= 4) return 1;
    if (rating <= 2) return -1;
    return 0;
  }
}
