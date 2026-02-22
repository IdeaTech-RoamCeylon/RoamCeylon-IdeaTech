// apps/backend/src/modules/feedback/ranking.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RankingService {
  private readonly CONFIDENCE_K = 10;
  private readonly TRUST_MIN = 0.8;
  private readonly TRUST_RANGE = 0.4;

  constructor(private readonly prisma: PrismaService) {}

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

    const confidence = totalFeedback / (totalFeedback + this.CONFIDENCE_K);

    const effectiveTrust = trustScore * confidence;

    const trustMultiplier = this.TRUST_MIN + this.TRUST_RANGE * effectiveTrust;

    const categoryMap = userCategoryWeights.reduce(
      (acc, cw) => {
        acc[cw.category] = cw.weight;
        return acc;
      },
      {} as Record<string, number>,
    );

    const rankedTrips = trips.map((trip) => {
      const categoryMultiplier = categoryMap[trip.category] ?? 1;

      const finalScore = trip.baseScore * categoryMultiplier * trustMultiplier;

      return { ...trip, finalScore };
    });

    rankedTrips.sort((a, b) => b.finalScore - a.finalScore);

    return rankedTrips;
  }

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

    return baseScore * categoryMultiplier * trustMultiplier;
  }
}
