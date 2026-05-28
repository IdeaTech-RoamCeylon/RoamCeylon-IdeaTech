// apps/backend/src/modules/ml/services/mlPrediction.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RetryService } from './retry.service';
import { BoundsEnforcerService } from '../../ai/bounds-enforcer.service';
import { spawn } from 'child_process';
import * as path from 'path';

// Derived types — always in sync with the Prisma schema, no manual duplication
type UserInterestProfileRow = Awaited<
  ReturnType<PrismaService['userInterestProfile']['findUnique']>
>;
type DestinationCategoryScoreRow = Awaited<
  ReturnType<PrismaService['destinationCategoryScore']['findMany']>
>[number];

export interface MLPredictionRequest {
  user_id: string;
  user_features?: {
    cultural_score?: number;
    adventure_score?: number;
    relaxation_score?: number;
  };
  destinations: { id: string; category: string }[];
}

export interface MLPredictionResponse {
  recommendations: {
    destination_id: string;
    ml_score: number;
  }[];
}

// Type for timeOfDayPrefs (safe JSON parsing)
type TimeOfDayPrefs = {
  morning?: number;
  afternoon?: number;
  evening?: number;
  night?: number;
};

@Injectable()
export class MlPredictionService {
  private readonly logger = new Logger(MlPredictionService.name);

  // LRU-style Prediction Cache (TTL: 1 hour)
  private readonly predictionCache = new Map<
    string,
    { data: MLPredictionResponse; timestamp: number }
  >();

  private readonly CACHE_TTL_MS = 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly retryService: RetryService,
    private readonly boundsEnforcer: BoundsEnforcerService,
  ) {}

  // SAFE getter (fixes unsafe access in IncrementalLearningService)
  getCache(): Map<string, { data: MLPredictionResponse; timestamp: number }> {
    return this.predictionCache;
  }

  private runPythonPredict(payload: any): Promise<MLPredictionResponse> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../../../../scripts/predict.py');
      const proc = spawn('python', [scriptPath]);

      let stdoutData = '';
      let stderrData = '';

      if (proc.stdout) {
        proc.stdout.on('data', (chunk) => {
          stdoutData += chunk.toString();
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (chunk) => {
          stderrData += chunk.toString();
        });
      }

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const parsed = JSON.parse(stdoutData.trim()) as MLPredictionResponse;
            resolve(parsed);
          } catch (err) {
            reject(new Error(`Failed to parse prediction output: ${err.message}. Output was: ${stdoutData}`));
          }
        } else {
          reject(new Error(`Prediction script failed with code ${code}. Error: ${stderrData}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });

      // Write input JSON to stdin
      proc.stdin.write(JSON.stringify(payload));
      proc.stdin.end();
    });
  }

  async getMLRecommendations(
    dto: MLPredictionRequest,
  ): Promise<MLPredictionResponse | null> {
    const { user_id, destinations } = dto;
    let features = dto.user_features;

    // Cache key
    const destinationIds = destinations
      .map((d) => d.id)
      .sort()
      .join(',');
    const cacheKey = `${user_id}:${destinationIds}`;

    const cached = this.predictionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.logger.debug(`Cache hit for predictions of user ${user_id}`);
      return cached.data;
    }

    // [Day 66 / Task 1] Fetch user profile with retry for transient DB errors
    const userProfile =
      await this.retryService.withRetry<UserInterestProfileRow>(
        () =>
          this.prisma.userInterestProfile.findUnique({
            where: { userId: user_id },
          }),
        {
          maxAttempts: 3,
          baseDelayMs: 100,
          label: 'userInterestProfile.findUnique',
        },
      );

    if (!features) {
      if (!userProfile) {
        this.logger.warn(`No features found for ${user_id}`);
        return null;
      }

      features = {
        cultural_score: userProfile.culturalScore,
        adventure_score: userProfile.adventureScore,
        relaxation_score: userProfile.relaxationScore,
      };
    }

    // Fetch destination popularity (FIXED: no any)
    const ids = destinations.map((d) => d.id);

    // [Day 66 / Task 1] Fetch destination popularity with retry
    const popularities = await this.retryService.withRetry<
      DestinationCategoryScoreRow[]
    >(
      () =>
        this.prisma.destinationCategoryScore.findMany({
          where: { destinationId: { in: ids } },
        }),
      {
        maxAttempts: 3,
        baseDelayMs: 100,
        label: 'destinationCategoryScore.findMany',
      },
    );

    const popularityMap = new Map<string, number>(
      popularities.map((p) => [p.destinationId, p.popularityScore]),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // EXTRA REAL FEATURE AGGREGATION
    // ─────────────────────────────────────────────────────────────────────────
    
    // Fetch user feedback signal with retry
    const feedbackSignal = await this.retryService.withRetry<any>(
      () =>
        this.prisma.userFeedbackSignal.findUnique({
          where: { userId: user_id },
        }),
      { maxAttempts: 3, baseDelayMs: 100, label: 'userFeedbackSignal.findUnique' },
    ).catch(() => null);

    // Fetch user category weights with retry
    const categoryWeights = await this.retryService.withRetry<any[]>(
      () =>
        this.prisma.userCategoryWeight.findMany({
          where: { userId: user_id },
        }),
      { maxAttempts: 3, baseDelayMs: 100, label: 'userCategoryWeight.findMany' },
    ).catch(() => []);

    // Fetch recommendation logs with retry to build engagement features
    const recLogs = await this.retryService.withRetry<any[]>(
      () =>
        this.prisma.recommendationLog.findMany({
          where: { userId: user_id },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      { maxAttempts: 3, baseDelayMs: 100, label: 'recommendationLog.findMany' },
    ).catch(() => []);

    const cultural = userProfile?.culturalScore ?? 0.5;
    const adventure = userProfile?.adventureScore ?? 0.5;
    const relaxation = userProfile?.relaxationScore ?? 0.5;
    
    const click_frequency = recLogs.length > 0 ? recLogs.filter(l => l.clicked).length / recLogs.length : 0.0;
    const strong_engagement_count = recLogs.filter(l => l.clicked).length;
    const ignored_recs_count = recLogs.filter(l => !l.clicked).length;

    let engagement_recency = 30; // default 30 days
    if (recLogs.length > 0 && recLogs[0]?.createdAt) {
      engagement_recency = Math.floor((Date.now() - new Date(recLogs[0].createdAt).getTime()) / (1000 * 60 * 60 * 24));
    }

    const totalFeedbackCount = feedbackSignal 
      ? (feedbackSignal.positiveCount + feedbackSignal.negativeCount + feedbackSignal.neutralCount) 
      : 0;

    const feedback_positivity_rate = totalFeedbackCount > 0 
      ? feedbackSignal.positiveCount / totalFeedbackCount 
      : 0.5;

    const user_trust_score = feedbackSignal?.trustScore ?? 0.5;

    // Map 15 features payload for predict.py input
    const userFeaturesPayload = {
      user_interest_score: (cultural + adventure + relaxation) / 3,
      cultural_match: cultural,
      adventure_match: adventure,
      relaxation_match: relaxation,
      click_frequency,
      feedback_positivity_rate,
      engagement_recency,
      diversity_score: userProfile?.categoryDiversity ?? 0.5,
      travel_pace_preference: 0.5,
      booking_conversion_rate: 0.5,
      category_affinity: categoryWeights.length > 0 ? categoryWeights[0].weight : 1.0,
      user_trust_score,
      strong_engagement_count,
      ignored_recs_count
    };

    // Prepare prediction destinations input
    const pyDestinations = destinations.map((d) => {
      const pop = popularityMap.get(d.id) ?? 0.5;
      return {
        destination_id: d.id,
        destination_popularity: pop,
      };
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MODEL PREDICTION WITH SECURE HEURISTIC FALLBACK
    // ─────────────────────────────────────────────────────────────────────────
    try {
      this.logger.log(`Invoking Python ML model for user ${user_id} prediction...`);
      const predictions = await this.runPythonPredict({
        user_features: userFeaturesPayload,
        destinations: pyDestinations,
      });

      // Clamp outputs using boundsEnforcer
      predictions.recommendations = predictions.recommendations.map((rec) => ({
        destination_id: rec.destination_id,
        ml_score: this.boundsEnforcer.enforceMlOutputScore(rec.ml_score, rec.destination_id),
      }));

      // Cache result
      this.predictionCache.set(cacheKey, {
        data: predictions,
        timestamp: Date.now(),
      });

      return predictions;
    } catch (e: any) {
      this.logger.warn(`Python ML inference failed, using rule-based mock fallback. Error: ${e.message}`);
    }

    // ── Rule-Based Heuristic Mock Fallback ───────────────────────────────────
    const prefs = (userProfile?.timeOfDayPrefs || {}) as TimeOfDayPrefs;

    // Time-of-day boost
    let timeOfDayBoost = 0;

    const hour = new Date().getHours();
    let currentPeriod: keyof TimeOfDayPrefs = 'night';

    if (hour >= 5 && hour < 12) currentPeriod = 'morning';
    else if (hour >= 12 && hour < 17) currentPeriod = 'afternoon';
    else if (hour >= 17 && hour < 22) currentPeriod = 'evening';

    const total =
      (prefs.morning ?? 0) +
      (prefs.afternoon ?? 0) +
      (prefs.evening ?? 0) +
      (prefs.night ?? 0);

    if (total > 0 && (prefs[currentPeriod] ?? 0) / total > 0.3) {
      timeOfDayBoost = 0.05;
    }

    // Diversity
    const diversity = userProfile?.categoryDiversity ?? 0;

    // Prediction logic
    const predictions = destinations.map((dest) => {
      let score = 0;
      const cat = dest.category?.toLowerCase() || '';

      if (cat.includes('cultur')) score = features?.cultural_score ?? 0;
      else if (cat.includes('adventur')) score = features?.adventure_score ?? 0;
      else if (cat.includes('relax')) score = features?.relaxation_score ?? 0;
      else {
        score =
          ((features?.cultural_score ?? 0) + (features?.adventure_score ?? 0)) /
          2; // Default mock average
      }

      // Feature: Destination Popularity Trend
      const popularity = popularityMap.get(dest.id) ?? 0;
      const popBoost = Math.min(popularity * 0.01, 0.15); // Max 15% boost from popularity

      // Feature: Category Diversity smoothing
      // E.g., if diversity is high (>0.8), we bring the score closer to 0.7 to avoid pigeonholing
      let normalizedScore = 0.5 + score * 0.05 + popBoost + timeOfDayBoost;

      // Diversity smoothing
      if (diversity > 0.8) {
        normalizedScore = normalizedScore * 0.8 + 0.7 * 0.2;
      }

      normalizedScore = Math.min(Math.max(normalizedScore, 0.1), 0.99);

      return {
        destination_id: dest.id,
        ml_score: Number(normalizedScore.toFixed(2)),
      };
    });

    // Sort descending by ml_score
    predictions.sort((a, b) => b.ml_score - a.ml_score);

    const result: MLPredictionResponse = {
      recommendations: predictions,
    };

    // Cache result
    this.predictionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    // Simple LRU cleanup
    if (this.predictionCache.size > 1000) {
      const iterator = this.predictionCache.keys().next();

      if (!iterator.done) {
        const oldestKey: string = iterator.value;
        this.predictionCache.delete(oldestKey);
      }
    }

    return result;
  }
}
