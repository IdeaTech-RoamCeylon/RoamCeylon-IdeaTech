// apps/backend/src/modules/ml/ml.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackBehaviorDto } from './dto/track-behavior.dto';
import {
  MlPredictionService,
  MLPredictionResponse,
} from './services/mlPrediction.service';
import { BoundsEnforcerService } from '../ai/bounds-enforcer.service';

type RecommendationSource = 'hybrid' | 'hybrid-capped' | 'rule-based';

@Injectable()
export class MlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlPredictionService: MlPredictionService,
    private readonly boundsEnforcer: BoundsEnforcerService,
  ) {}

  async trackBehavior(dto: TrackBehaviorDto) {
    try {
      const event = await this.prisma.userBehaviorEvent.create({
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
    // 1. Get rule-based recommendations (baseline)
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

    // Controlled Rollout System - 20% of users get ML recommendations
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

      const match = mlResults?.recommendations?.find(
        (m) => m.destination_id === ruleRec.item_id,
      );

      if (match) {
        mlScore = match.ml_score;
      }

      const ruleScore = ruleRec.score;

      // Improve Hybrid Balance -> ML weight slightly ↑
      // Adjusted weights: Rule-Based 60% (0.6), ML 40% (0.4)
      const useMl = mlScore > 0;

      let finalScore: number;
      let source: RecommendationSource;

      if (useMl) {
        // Enforce ML influence bounds before blending
        const bounded = this.boundsEnforcer.enforceHybridScore({
          ruleScore,
          mlScore,
          mlWeight: 0.4,
          ruleWeight: 0.6,
        });

        finalScore = bounded.finalScore;
        source = bounded.cappedByBound ? 'hybrid-capped' : 'hybrid';
      } else {
        finalScore = ruleScore;
        source = 'rule-based';
      }

      // Hard clamp on final score as last line of defense
      finalScore = this.boundsEnforcer.enforceFinalScore(
        finalScore,
        `recommendations:${ruleRec.item_id}`,
      );

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

    // ── Filter by minimum score threshold ────────────────────────────────
    const RECOMMENDATION_THRESHOLD = 0.65; // raised from implicit 0 — reduces over-recommendation
    const filtered = finalRecommendations.filter(
      (rec) => rec.final_score >= RECOMMENDATION_THRESHOLD,
    );

    // Return filtered if we have results, otherwise fall back to top 3 unfiltered
    const recommendations =
      filtered.length > 0 ? filtered : finalRecommendations.slice(0, 3);

    // 4. Log the recommendations shown to the user
    try {
      await Promise.all(
        finalRecommendations.map((rec) =>
          this.prisma.recommendationLog.create({
            data: {
              userId,
              itemId: rec.destination_id,
              score: rec.final_score,
              mlScore: rec.ml_score,
              ruleScore: rec.rule_score,
              finalScore: rec.final_score,
              source: rec.source,
            },
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to log recommendations:', error);
    }

    return {
      user_id: userId,
      recommendations: recommendations,
    };
  }
}
