/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackBehaviorDto } from './dto/track-behavior.dto';
import {
  MlPredictionService,
  MLPredictionResponse,
} from './services/mlPrediction.service';

@Injectable()
export class MlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlPredictionService: MlPredictionService,
  ) {}

  async trackBehavior(dto: TrackBehaviorDto) {
    try {
      const event = await (this.prisma as any).userBehaviorEvent.create({
        data: {
          userId: dto.user_id,
          eventType: dto.event_type,
          itemId: dto.item_id,
          metadata: dto.metadata || {},
        },
      });
      return { success: true, eventId: event.id };
    } catch {
      throw new InternalServerErrorException('Failed to track behavior event');
    }
  }

  async getPersonalizedRecommendations(userId: string) {
    // 1. Get rule-based recommendations
    const ruleRecommendations = [
      {
        item_id: 'trip_001',
        title: 'Sigiriya Rock Fortress',
        score: 0.92,
        reason: 'Because you liked cultural destinations',
      },
      {
        item_id: 'trip_002',
        title: 'Ella Scenic Tour',
        score: 0.87,
        reason: 'Popular among similar users',
      },
    ];

    // 2. Fetch ML properties for destinations
    // Fallback categories for mock
    const destinationsInput = ruleRecommendations.map((r) => ({
      id: r.item_id,
      category: r.item_id === 'trip_001' ? 'cultural' : 'mixed',
    }));

    let mlResults: MLPredictionResponse | null = null;

    // Controlled Rollout System (Day 63 - Task 1)
    // 20% of users get ML recommendations
    const userHash = [...userId].reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );
    const isMlEnabled = userHash % 10 < 2;

    if (isMlEnabled) {
      try {
        mlResults = await this.mlPredictionService.getMLRecommendations({
          user_id: userId,
          destinations: destinationsInput,
        });
      } catch (error) {
        console.error(
          'ML service failed, falling back to rule-based ONLY',
          error,
        );
      }
    }

    // 3. Build Hybrid Score
    const finalRecommendations = ruleRecommendations.map((ruleRec) => {
      let mlScore = 0;
      if (mlResults?.recommendations) {
        const match = mlResults.recommendations.find(
          (m) => m.destination_id === ruleRec.item_id,
        );
        if (match) mlScore = match.ml_score;
      }

      const ruleScore = ruleRec.score;
      // Day 64 - Task 3: Improve Hybrid Balance -> ML weight slightly ↑
      // Adjusted weights: Rule-Based 60% (0.6), ML 40% (0.4)
      const useMl = mlScore > 0;
      const finalScore = useMl ? ruleScore * 0.6 + mlScore * 0.4 : ruleScore;
      const source = useMl ? 'hybrid' : 'rule-based';

      return {
        destination_id: ruleRec.item_id,
        final_score: Number(finalScore.toFixed(2)),
        ml_score: mlScore,
        rule_score: ruleScore,
        source,
        reason: ruleRec.reason,
      };
    });

    // Sort descending by final score
    finalRecommendations.sort((a, b) => b.final_score - a.final_score);

    // 4. Log the recommendations shown to the user
    try {
      await Promise.all(
        finalRecommendations.map((rec) =>
          (this.prisma as any).recommendationLog.create({
            data: {
              userId,
              itemId: rec.destination_id,
              score: rec.final_score,
              mlScore: rec.ml_score,
              ruleScore: rec.rule_score,
              finalScore: rec.final_score,
              source: rec.source as any,
            },
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to log recommendations:', error);
    }

    return {
      user_id: userId,
      recommendations: finalRecommendations,
    };
  }
}
