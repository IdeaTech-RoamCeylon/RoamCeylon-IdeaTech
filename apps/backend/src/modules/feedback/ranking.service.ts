// apps/backend/src/modules/feedback/ranking.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RankingService {
  private readonly CONFIDENCE_K = 10; // Controls how fast confidence grows
  private readonly TRUST_MIN = 0.8;   // Minimum trust multiplier
  private readonly TRUST_RANGE = 0.4; // Range to reach 1.2 max

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rank trips using:
   * - baseScore
   * - category weight
   * - trust score (time-decayed + Bayesian)
   * - confidence scaling
   */
  async rankTrips(
    userId: string,
    trips: { id: string; baseScore: number; category: string }[],
  ) {
    // Fetch trust signal + total feedback in parallel
    const [userSignal, totalFeedback, userCategoryWeights] =
      await Promise.all([
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

    // -----------------------------
    // Confidence Scaling
    // confidence = N / (N + K)
    // -----------------------------
    const confidence =
      totalFeedback / (totalFeedback + this.CONFIDENCE_K);

    const effectiveTrust = trustScore * confidence;

    // Final trust multiplier between 0.8 → 1.2
    const trustMultiplier =
      this.TRUST_MIN + this.TRUST_RANGE * effectiveTrust;

    // -----------------------------
    // Category weight map
    // -----------------------------
    const categoryWeightMap = userCategoryWeights.reduce(
      (acc, cw) => {
        acc[cw.category] = cw.weight;
        return acc;
      },
      {} as Record<string, number>,
    );

    // -----------------------------
    // Compute final score
    // -----------------------------
    const rankedTrips = trips.map((trip) => {
      const categoryMultiplier =
        categoryWeightMap[trip.category] ?? 1;

      const finalScore =
        trip.baseScore *
        categoryMultiplier *
        trustMultiplier;

      return {
        ...trip,
        finalScore,
      };
    });

    rankedTrips.sort((a, b) => b.finalScore - a.finalScore);

    return rankedTrips;
  }

  /**
   * Compute score for single trip
   */
  async computeTripScore(
    userId: string,
    baseScore: number,
    category: string,
  ) {
    const [userSignal, totalFeedback, categoryWeightRecord] =
      await Promise.all([
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

    const confidence =
      totalFeedback / (totalFeedback + this.CONFIDENCE_K);

    const effectiveTrust = trustScore * confidence;

    const trustMultiplier =
      this.TRUST_MIN + this.TRUST_RANGE * effectiveTrust;

    const categoryWeight = categoryWeightRecord?.weight ?? 1;

    return baseScore * categoryWeight * trustMultiplier;
  }
}