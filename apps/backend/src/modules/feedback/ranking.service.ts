// apps/backend/src/modules/feedback/ranking.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  // CONFIDENCE CONTROL
  private readonly CONFIDENCE_K = 10;

  // TRUST MULTIPLIER BOUNDS
  private readonly TRUST_MIN = 0.8;
  private readonly TRUST_RANGE = 0.4; // trust effect max ±20%

  // GLOBAL PERSONALIZATION CAP
  private readonly MAX_PERSONALIZATION_FACTOR = 1.5; // +50%
  private readonly MIN_PERSONALIZATION_FACTOR = 0.7; // -30%

  constructor(private readonly prisma: PrismaService) {}

  // ==================================================
  // Rank Multiple Trips (Strict Controlled Learning)
  // ==================================================

  async rankTrips(
    userId: string,
    trips: { id: string; baseScore: number; category: string }[],
  ) {
    const [userSignal, totalFeedback, userCategoryWeights] = await Promise.all([
      this.prisma.userFeedbackSignal.findUnique({
        where: { userId },
      }),
      this.prisma.plannerFeedback.count({
        where: { userId },
      }),
      this.prisma.userCategoryWeight.findMany({
        where: { userId },
      }),
    ]);

    const trustScore = userSignal?.trustScore ?? 0.5;

    // Confidence Scaling
    const confidence = totalFeedback / (totalFeedback + this.CONFIDENCE_K);

    const effectiveTrust = trustScore * confidence;

    // Bounded Trust Multiplier
    const trustMultiplier = this.TRUST_MIN + this.TRUST_RANGE * effectiveTrust;

    const categoryMap = userCategoryWeights.reduce(
      (acc, cw) => {
        acc[cw.category] = cw.weight;
        return acc;
      },
      {} as Record<string, number>,
    );

    this.logger.log(
      `[LearningMetrics] Ranking Start: userId=${userId}, trustScore=${trustScore.toFixed(
        4,
      )}, confidence=${confidence.toFixed(
        4,
      )}, trustMultiplier=${trustMultiplier.toFixed(
        4,
      )}, totalFeedback=${totalFeedback}`,
    );

    const rankedTrips = trips.map((trip) => {
      const categoryMultiplier = categoryMap[trip.category] ?? 1;

      // Raw personalization factor
      const rawFactor = categoryMultiplier * trustMultiplier;

      // GLOBAL CLAMP (STRICT CONTROL)
      const safeFactor = Math.max(
        this.MIN_PERSONALIZATION_FACTOR,
        Math.min(rawFactor, this.MAX_PERSONALIZATION_FACTOR),
      );

      const finalScore = trip.baseScore * safeFactor;

      const adjustmentMagnitude = Math.abs(finalScore - trip.baseScore);

      this.logger.debug(
        `[LearningMetrics] Trip Adjusted: tripId=${trip.id}, category=${trip.category}, baseScore=${trip.baseScore.toFixed(
          3,
        )}, categoryMultiplier=${categoryMultiplier.toFixed(
          3,
        )}, rawFactor=${rawFactor.toFixed(3)}, safeFactor=${safeFactor.toFixed(
          3,
        )}, finalScore=${finalScore.toFixed(
          3,
        )}, adjustmentMagnitude=${adjustmentMagnitude.toFixed(3)}`,
      );

      return { ...trip, finalScore };
    });

    rankedTrips.sort((a, b) => b.finalScore - a.finalScore);

    return rankedTrips;
  }

  // ==================================================
  // Compute Score for Single Trip
  // ==================================================

  async computeTripScore(
    userId: string,
    baseScore: number,
    category: string,
  ): Promise<number> {
    const [userSignal, totalFeedback, categoryWeight] = await Promise.all([
      this.prisma.userFeedbackSignal.findUnique({
        where: { userId },
      }),
      this.prisma.plannerFeedback.count({
        where: { userId },
      }),
      this.prisma.userCategoryWeight.findUnique({
        where: {
          userId_category: { userId, category },
        },
      }),
    ]);

    const trustScore = userSignal?.trustScore ?? 0.5;

    const confidence = totalFeedback / (totalFeedback + this.CONFIDENCE_K);

    const effectiveTrust = trustScore * confidence;

    const trustMultiplier = this.TRUST_MIN + this.TRUST_RANGE * effectiveTrust;

    const categoryMultiplier = categoryWeight?.weight ?? 1;

    const rawFactor = categoryMultiplier * trustMultiplier;

    const safeFactor = Math.max(
      this.MIN_PERSONALIZATION_FACTOR,
      Math.min(rawFactor, this.MAX_PERSONALIZATION_FACTOR),
    );

    const finalScore = baseScore * safeFactor;

    const adjustmentMagnitude = Math.abs(finalScore - baseScore);

    this.logger.log(
      `[LearningMetrics] Score Computed: userId=${userId}, category=${category}, baseScore=${baseScore.toFixed(
        3,
      )}, trustMultiplier=${trustMultiplier.toFixed(
        4,
      )}, categoryMultiplier=${categoryMultiplier.toFixed(
        3,
      )}, rawFactor=${rawFactor.toFixed(3)}, safeFactor=${safeFactor.toFixed(
        3,
      )}, finalScore=${finalScore.toFixed(
        3,
      )}, adjustmentMagnitude=${adjustmentMagnitude.toFixed(3)}`,
    );

    return finalScore;
  }
}
