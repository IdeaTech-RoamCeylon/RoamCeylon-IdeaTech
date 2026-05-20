// apps/backend/src/modules/ml/services/mlPrediction.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RetryService } from './retry.service';

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
  ) {}

  // SAFE getter (fixes unsafe access in IncrementalLearningService)
  getCache(): Map<string, { data: MLPredictionResponse; timestamp: number }> {
    return this.predictionCache;
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
