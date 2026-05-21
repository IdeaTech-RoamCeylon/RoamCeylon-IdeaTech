// apps/backend/src/modules/ml/ml.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import * as os from 'os';
import * as process from 'process';
import { MlService } from './ml.service';
import { TrackBehaviorDto } from './dto/track-behavior.dto';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';
import {
  MlPredictionService,
  MLPredictionRequest,
} from './services/mlPrediction.service';
import { LatencyTrackerService } from '../analytics/latency-tracker.service';
import { IncrementalLearningService } from './services/incremental-learning.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ModelRetrainingService } from './services/model-retraining.service';
import { RecommendationCacheService } from './services/recommendation-cache.service';
import { BackgroundQueueService } from './services/background-queue.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { DbOptimizationService } from './services/db-optimization.service';

@Controller('api')
export class MlController {
  constructor(
    private readonly mlService: MlService,
    private readonly mlPredictionService: MlPredictionService,
    private readonly latencyTracker: LatencyTrackerService,
    private readonly incrementalLearning: IncrementalLearningService,
    private readonly prisma: PrismaService,
    private readonly modelRetrainingService: ModelRetrainingService,
    private readonly recommendationCache: RecommendationCacheService,
    private readonly backgroundQueue: BackgroundQueueService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly dbOptimization: DbOptimizationService,
  ) {}

  // ── Existing endpoints ────────────────────────────────────────────────────────

  @Post('ml/recommendations')
  async getMLRecommendations(@Body() body: MLPredictionRequest) {
    return this.latencyTracker.measure(
      {
        endpoint: '/api/ml/recommendations',
        method: 'POST',
        userId: body.user_id,
      },
      async () => {
        const result =
          await this.mlPredictionService.getMLRecommendations(body);
        if (!result) return { recommendations: [] };
        return result;
      },
    );
  }

  @Post('behavior/track')
  async trackBehavior(@Body() dto: TrackBehaviorDto) {
    return this.latencyTracker.measure(
      {
        endpoint: '/api/behavior/track',
        method: 'POST',
        userId: dto.user_id,
      },
      () => this.mlService.trackBehavior(dto),
    );
  }

  /**
   * GET /api/recommendations/personalized?userId=xxx
   *
   * [Day 65 / Task 1] Optimized for < 500ms:
   *   - Checks recommendation result cache first (5-min TTL)
   *   - Recommendation log writes are fire-and-forget
   *   - ML prediction gated by circuit breaker (auto-fallback to rule-based)
   *
   * [Day 66 / Task 1] Reliability:
   *   - userId query param validated via GetRecommendationsDto
   *   - Hard 5s timeout enforced by TimeoutInterceptor
   */
  @Get('recommendations/personalized')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPersonalizedRecommendations(@Query() query: GetRecommendationsDto) {
    const uid = query.userId ?? 'admin';
    return this.latencyTracker.measure(
      {
        endpoint: '/api/recommendations/personalized',
        method: 'GET',
        userId: uid,
      },
      () => this.mlService.getPersonalizedRecommendations(uid),
    );
  }

  // ── Incremental Learning endpoints ────────────────────────────────────────────

  /**
   * POST /api/ml/incremental/refresh/:userId
   * Manually trigger a full feature refresh for a user.
   */
  @Post('ml/incremental/refresh/:userId')
  async refreshUserFeatures(@Param('userId') userId: string) {
    await this.incrementalLearning.refreshAllUserFeatures(userId);
    return {
      success: true,
      message: `Features refreshed for userId=${userId}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/ml/incremental/status/:userId
   * Returns current ML interest profile and incremental learning status.
   */
  @Get('ml/incremental/status/:userId')
  async getIncrementalStatus(@Param('userId') userId: string) {
    const profile = await this.prisma.userInterestProfile.findUnique({
      where: { userId },
      select: {
        culturalScore: true,
        adventureScore: true,
        relaxationScore: true,
        categoryDiversity: true,
        updatedAt: true,
      },
    });

    const feedbackCount = await this.prisma.plannerFeedback.count({
      where: { userId },
    });

    const nextRefreshAt =
      feedbackCount === 0 ? 5 : Math.ceil((feedbackCount + 1) / 5) * 5;

    const feedbacksUntilRefresh = nextRefreshAt - feedbackCount;

    return {
      userId,
      feedbackCount,
      nextFullRefreshAt: nextRefreshAt,
      feedbacksUntilRefresh,
      currentProfile: profile ?? {
        message: 'No profile yet — submit feedback to create one',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ── Model Retraining endpoints ─────────────────────────────────────────────────

  /** POST /api/ml/retrain — Triggers the background model retraining pipeline */
  @Post('ml/retrain')
  triggerRetraining() {
    this.modelRetrainingService.triggerRetraining();
    return {
      success: true,
      message:
        'Model retraining pipeline triggered successfully in the background.',
      timestamp: new Date().toISOString(),
    };
  }

  /** GET /api/ml/retrain/status — Returns retraining pipeline status, logs, and comparison report */
  @Get('ml/retrain/status')
  getRetrainingStatus() {
    return this.modelRetrainingService.getStatus();
  }

  /** POST /api/ml/retrain/cancel — Manually cancels the running retraining pipeline */
  @Post('ml/retrain/cancel')
  cancelRetraining() {
    this.modelRetrainingService.cancelRetraining();
    return {
      success: true,
      message: 'Model retraining cancellation signal sent.',
      timestamp: new Date().toISOString(),
    };
  }

  // ── Day 65 / Task 2 & 3 — Observability endpoints ─────────────────────────────

  /**
   * GET /api/ml/cache/stats
   * Returns recommendation cache and user profile cache statistics.
   * [Day 65 / Task 2]
   */
  @Get('ml/cache/stats')
  getCacheStats() {
    return {
      ...this.recommendationCache.getCacheStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/ml/queue/stats
   * Returns background queue statistics: pending, active, completed, failed.
   * [Day 65 / Task 3]
   */
  @Get('ml/queue/stats')
  getQueueStats() {
    return {
      ...this.backgroundQueue.getQueueStats(),
      timestamp: new Date().toISOString(),
    };
  }

  // ── Day 66 / Task 2 — Database optimization stats ─────────────────────────────

  /**
   * GET /api/ml/db/stats
   * Returns table sizes, row estimates, and the slowest endpoints over the last 24h.
   * [Day 66 / Task 2]
   */
  @Get('ml/db/stats')
  async getDbStats() {
    return this.dbOptimization.getDbStats();
  }

  // ── Day 66 / Task 3 — System health endpoint ──────────────────────────────────

  /**
   * GET /api/ml/health
   * Aggregated health check:
   *   - ML circuit breaker states (ml-prediction, recommendation-cache)
   *   - Cache hit rates and sizes
   *   - Background queue counters
   *   - Current CPU load and memory usage
   *
   * System must NEVER break — this endpoint is the single pane of glass.
   * [Day 66 / Task 3]
   */
  @Get('ml/health')
  getSystemHealth() {
    const cpuLoad = os.loadavg()[0];
    const cpuCores = os.cpus().length;
    const memoryMb = Math.round(process.memoryUsage().rss / (1024 * 1024));

    const cacheStats = this.recommendationCache.getCacheStats();
    const queueStats = this.backgroundQueue.getQueueStats();
    const circuitStates = this.circuitBreaker.getAllStates();

    // Determine overall health
    const mlCircuitOpen = circuitStates['ml-prediction']?.state === 'OPEN';
    const cacheCircuitOpen =
      circuitStates['recommendation-cache']?.state === 'OPEN';
    const queueBacklogged = queueStats.pending > 100;
    const cpuOverloaded = cpuLoad > cpuCores;

    let overallStatus: 'healthy' | 'degraded' | 'critical';
    const issues: string[] = [];

    if (mlCircuitOpen)
      issues.push('ML prediction circuit OPEN (fallback active)');
    if (cacheCircuitOpen) issues.push('Recommendation cache circuit OPEN');
    if (queueBacklogged)
      issues.push(
        `Background queue backlogged (${queueStats.pending} pending)`,
      );
    if (cpuOverloaded)
      issues.push(
        `CPU overloaded: load=${cpuLoad.toFixed(2)} cores=${cpuCores}`,
      );

    if (mlCircuitOpen && cacheCircuitOpen) {
      overallStatus = 'critical';
    } else if (issues.length > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      issues,
      circuitBreakers: circuitStates,
      cache: cacheStats,
      queue: queueStats,
      system: {
        cpuLoad: Number(cpuLoad.toFixed(2)),
        cpuCores,
        memoryMb,
        cpuLoadNormalized: Number((cpuLoad / cpuCores).toFixed(2)),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
