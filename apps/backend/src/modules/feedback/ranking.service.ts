// apps/backend/src/modules/feedback/ranking.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PrismaClient,
  UserFeedbackSignal,
  UserCategoryWeight,
} from '@prisma/client';

@Injectable()
export class RankingService {
  private readonly CONFIDENCE_K = 10;
  private readonly TRUST_MIN = 0.8;
  private readonly TRUST_RANGE = 0.4;
  private readonly db: PrismaClient;

  constructor(private readonly prisma: PrismaService) {
    this.db = prisma as unknown as PrismaClient;
  }

  async rankTrips(
    userId: string,
    trips: { id: string; baseScore: number; category: string }[],
  ) {
    const [userSignal, totalFeedback, userCategoryWeights]: [
      UserFeedbackSignal | null,
      number,
      UserCategoryWeight[],
    ] = await Promise.all([
      this.db.userFeedbackSignal.findUnique({
        where: { userId },
      }),
      this.db.plannerFeedback.count({
        where: { userId },
      }),
      this.db.userCategoryWeight.findMany({
        where: { userId },
      }),
    ]);

    const trustScore: number = userSignal?.trustScore ?? 0.5;

    const confidence: number =
      totalFeedback / (totalFeedback + this.CONFIDENCE_K);

    const effectiveTrust: number = trustScore * confidence;

    const trustMultiplier: number =
      this.TRUST_MIN + this.TRUST_RANGE * effectiveTrust;

    const categoryWeightMap: Record<string, number> =
      userCategoryWeights.reduce(
        (acc: Record<string, number>, cw: UserCategoryWeight) => {
          acc[cw.category] = cw.weight;
          return acc;
        },
        {} as Record<string, number>,
      );

    const rankedTrips = trips.map((trip) => {
      const categoryMultiplier: number = categoryWeightMap[trip.category] ?? 1;
      const finalScore: number =
        trip.baseScore * categoryMultiplier * trustMultiplier;
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
    const [userSignal, totalFeedback, categoryWeightRecord]: [
      UserFeedbackSignal | null,
      number,
      UserCategoryWeight | null,
    ] = await Promise.all([
      this.db.userFeedbackSignal.findUnique({
        where: { userId },
      }),
      this.db.plannerFeedback.count({
        where: { userId },
      }),
      this.db.userCategoryWeight.findUnique({
        where: {
          userId_category: { userId, category },
        },
      }),
    ]);

    const trustScore: number = userSignal?.trustScore ?? 0.5;

    const confidence: number =
      totalFeedback / (totalFeedback + this.CONFIDENCE_K);

    const effectiveTrust: number = trustScore * confidence;

    const trustMultiplier: number =
      this.TRUST_MIN + this.TRUST_RANGE * effectiveTrust;

    const categoryWeight: number = categoryWeightRecord?.weight ?? 1;

    return baseScore * categoryWeight * trustMultiplier;
  }
}
