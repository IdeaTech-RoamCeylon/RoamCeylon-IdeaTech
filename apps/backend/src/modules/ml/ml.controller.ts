// apps/backend/src/modules/ml/ml.controller.ts

import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { MlService } from './ml.service';
import { TrackBehaviorDto } from './dto/track-behavior.dto';
import {
  MlPredictionService,
  MLPredictionRequest,
} from './services/mlPrediction.service';
import { LatencyTrackerService } from '../analytics/latency-tracker.service';
import { IncrementalLearningService } from './services/incremental-learning.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ModelRetrainingService } from './services/model-retraining.service';

@Controller('api')
export class MlController {
  constructor(
    private readonly mlService: MlService,
    private readonly mlPredictionService: MlPredictionService,
    private readonly latencyTracker: LatencyTrackerService,
    private readonly incrementalLearning: IncrementalLearningService,
    private readonly prisma: PrismaService,
    private readonly modelRetrainingService: ModelRetrainingService,
  ) {}

  // ── Existing endpoints (unchanged) ────────────────────────────────────────

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

  @Get('recommendations/personalized')
  async getPersonalizedRecommendations(@Query('userId') userId?: string) {
    const uid = userId ?? 'admin';
    return this.latencyTracker.measure(
      {
        endpoint: '/api/recommendations/personalized',
        method: 'GET',
        userId: uid,
      },
      () => this.mlService.getPersonalizedRecommendations(uid),
    );
  }

  // ── Incremental Learning endpoints (new) ──────────────────────────────────

  /**
   * Manually trigger a full feature refresh for a user.
   * Useful for testing or forcing a recalculation outside the automatic threshold.
   *
   * POST /api/ml/incremental/refresh/:userId
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
   * Returns the current ML interest profile and incremental learning status
   * for a user — useful for verifying the system is working correctly.
   *
   * GET /api/ml/incremental/status/:userId
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

    // Next full refresh triggers at the next multiple of 5
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

  // ── Model Retraining endpoints (new) ──────────────────────────────────────

  /**
   * Triggers the background model retraining pipeline.
   *
   * POST /api/ml/retrain
   */
  @Post('ml/retrain')
  async triggerRetraining() {
    this.modelRetrainingService.triggerRetraining();
    return {
      success: true,
      message: 'Model retraining pipeline triggered successfully in the background.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns the current retraining pipeline status, logs, and comparison report.
   *
   * GET /api/ml/retrain/status
   */
  @Get('ml/retrain/status')
  async getRetrainingStatus() {
    return this.modelRetrainingService.getStatus();
  }

  /**
   * Manually cancels the running model retraining pipeline.
   *
   * POST /api/ml/retrain/cancel
   */
  @Post('ml/retrain/cancel')
  async cancelRetraining() {
    this.modelRetrainingService.cancelRetraining();
    return {
      success: true,
      message: 'Model retraining cancellation signal sent.',
      timestamp: new Date().toISOString(),
    };
  }
}
