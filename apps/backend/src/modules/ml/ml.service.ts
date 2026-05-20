// apps/backend/src/modules/ml/ml.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackBehaviorDto } from './dto/track-behavior.dto';
import {
  MlPredictionService,
  MLPredictionResponse,
} from './services/mlPrediction.service';
import { BoundsEnforcerService } from '../ai/bounds-enforcer.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RecommendationCacheService } from './services/recommendation-cache.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import * as os from 'os';
import * as process from 'process';

type RecommendationSource = 'hybrid' | 'hybrid-capped' | 'rule-based';

// ─── Circuit breaker names ───────────────────────────────────────────────────
const CB_ML_PREDICTION = 'ml-prediction';
const CB_RECOMMENDATION_CACHE = 'recommendation-cache';

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlPredictionService: MlPredictionService,
    private readonly boundsEnforcer: BoundsEnforcerService,
    private readonly analyticsService: AnalyticsService,
    private readonly recommendationCache: RecommendationCacheService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  // ── Track Behavior ──────────────────────────────────────────────────────────

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

  // ── Personalized Recommendations ─────────────────────────────────────────────

  async getPersonalizedRecommendations(userId: string) {
    // ─ [Day 65 / Task 2] Check recommendation cache first ───────────────────
    const cached = this.safeGetRecommendationCache(userId);
    if (cached) {
      this.logger.debug(
        `[Recommendations] Cache HIT for userId=${userId} — returning early`,
      );
      return cached;
    }

    // ─ System metrics (non-blocking fire-and-forget) ─────────────────────────
    const cpuLoad = os.loadavg()[0];
    const memoryMb = process.memoryUsage().rss / (1024 * 1024);

    const cpuCores = os.cpus().length;
    if (cpuLoad > cpuCores) {
      this.logger.warn(
        `Dangerously high CPU load detected: ${cpuLoad.toFixed(2)} (Cores: ${cpuCores})`,
      );
    }

    // [Day 65 / Task 1] Fire-and-forget analytics — never blocks the response
    this.analyticsService
      .recordEvent('system', 'ml_recommendations_served', userId, {
        cpuLoad,
        memoryMb,
      })
      .catch((err) => {
        this.logger.error(
          `Failed to record system metrics: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

    // ─ Rule-based recommendations (baseline) ────────────────────────────────
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

    const destinationsInput = ruleRecommendations.map((r) => ({
      id: r.item_id,
      category: r.item_id === 'trip_001' ? 'cultural' : 'mixed',
    }));

    // ─ Controlled Rollout (50%) + Circuit Breaker ────────────────────────────
    const userHash = [...userId].reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );
    const isMlEnabled = userHash % 10 < 5;

    let mlResults: MLPredictionResponse | null = null;

    if (isMlEnabled && !this.circuitBreaker.isOpen(CB_ML_PREDICTION)) {
      try {
        mlResults = await this.mlPredictionService.getMLRecommendations({
          user_id: userId,
          destinations: destinationsInput,
        });
        // [Day 66 / Task 3] Record ML success to potentially close circuit
        this.circuitBreaker.recordSuccess(CB_ML_PREDICTION);
      } catch (error) {
        // [Day 66 / Task 3] Record failure — circuit opens after 5 consecutive
        this.circuitBreaker.recordFailure(CB_ML_PREDICTION);
        this.logger.warn(
          `ML prediction failed for userId=${userId}, falling back to rule-based. ` +
            `Circuit: ${this.circuitBreaker.getState(CB_ML_PREDICTION).state}. ` +
            `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else if (isMlEnabled && this.circuitBreaker.isOpen(CB_ML_PREDICTION)) {
      this.logger.warn(
        `[CircuitBreaker] ML prediction circuit OPEN for userId=${userId} — using rule-based fallback`,
      );
    }

    // ─ Build Hybrid Score ────────────────────────────────────────────────────
    const finalRecommendations = ruleRecommendations.map((ruleRec) => {
      let mlScore = 0;

      const match = mlResults?.recommendations?.find(
        (m) => m.destination_id === ruleRec.item_id,
      );

      if (match) {
        mlScore = match.ml_score;
      }

      const ruleScore = ruleRec.score;
      const useMl = mlScore > 0;

      let finalScore: number;
      let source: RecommendationSource;

      if (useMl) {
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

    // Filter by minimum score threshold
    const RECOMMENDATION_THRESHOLD = 0.65;
    const filtered = finalRecommendations.filter(
      (rec) => rec.final_score >= RECOMMENDATION_THRESHOLD,
    );

    const recommendations =
      filtered.length > 0 ? filtered : finalRecommendations.slice(0, 3);

    // ─ [Day 66 / Task 2] Batch recommendation log write — non-blocking ───────
    // Uses createMany (single DB round trip) + fire-and-forget
    setImmediate(() => {
      this.prisma.recommendationLog
        .createMany({
          data: finalRecommendations.map((rec) => ({
            userId,
            itemId: rec.destination_id,
            score: rec.final_score,
            mlScore: rec.ml_score,
            ruleScore: rec.rule_score,
            finalScore: rec.final_score,
            source: rec.source,
          })),
          skipDuplicates: true,
        })
        .catch((error: unknown) => {
          this.logger.error(
            `Failed to log recommendations: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    });

    const result = {
      user_id: userId,
      recommendations,
    };

    // ─ [Day 65 / Task 2] Populate recommendation cache ──────────────────────
    this.safeSetRecommendationCache(userId, result);

    return result;
  }

  // ── Cache invalidation (called by IncrementalLearningService) ────────────────

  invalidateRecommendationCache(userId: string): void {
    this.recommendationCache.invalidate(userId);
  }

  // ── Private cache helpers (circuit-breaker guarded) ──────────────────────────

  private safeGetRecommendationCache(
    userId: string,
  ): ReturnType<typeof this.recommendationCache.getRecommendation> {
    if (this.circuitBreaker.isOpen(CB_RECOMMENDATION_CACHE)) {
      return null;
    }
    try {
      const result = this.recommendationCache.getRecommendation(userId);
      if (result !== null) {
        this.circuitBreaker.recordSuccess(CB_RECOMMENDATION_CACHE);
      }
      return result;
    } catch (err) {
      this.circuitBreaker.recordFailure(CB_RECOMMENDATION_CACHE);
      this.logger.warn(
        `[Cache] getRecommendation() error for userId=${userId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private safeSetRecommendationCache(
    userId: string,
    data: { user_id: string; recommendations: unknown[] },
  ): void {
    try {
      this.recommendationCache.setRecommendation(
        userId,
        data as Parameters<
          typeof this.recommendationCache.setRecommendation
        >[1],
      );
    } catch (err) {
      this.logger.warn(
        `[Cache] setRecommendation() error for userId=${userId}: ${(err as Error).message}`,
      );
    }
  }
}
