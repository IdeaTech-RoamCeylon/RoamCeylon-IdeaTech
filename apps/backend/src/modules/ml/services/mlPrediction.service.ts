/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

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

@Injectable()
export class MlPredictionService {
  private readonly logger = new Logger(MlPredictionService.name);

  // LRU-style Prediction Cache (TTL: 1 hour)
  private readonly predictionCache = new Map<
    string,
    { data: MLPredictionResponse; timestamp: number }
  >();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates ML predictions. Falls back to features passed in the request if provided,
   * otherwise fetches from the database.
   */
  async getMLRecommendations(
    dto: MLPredictionRequest,
  ): Promise<MLPredictionResponse | null> {
    const { user_id, destinations } = dto;
    let features = dto.user_features;
    let userProfile: any = null;

    // Cache Check
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

    // Load from DB if features not provided or we need extended features
    if (!features) {
      userProfile = await (this.prisma as any).userInterestProfile.findUnique({
        where: { userId: user_id },
      });

      if (!userProfile) {
        this.logger.warn(
          `No features found for ${user_id}. Returning null for fallback.`,
        );
        return null;
      }

      features = {
        cultural_score: userProfile.culturalScore,
        adventure_score: userProfile.adventureScore,
        relaxation_score: userProfile.relaxationScore,
      };
    }

    // Batch fetch destination popularities
    const ids = destinations.map((d) => d.id);
    const popularities = await (
      this.prisma as any
    ).destinationCategoryScore.findMany({
      where: { destinationId: { in: ids } },
    });
    const popularityMap = new Map(
      popularities.map((p) => [p.destinationId, p.popularityScore]),
    );

    // Time-of-day logic
    let timeOfDayBoost = 0;
    if (userProfile && userProfile.timeOfDayPrefs) {
      const prefs = userProfile.timeOfDayPrefs;
      const hour = new Date().getHours();
      let currentPeriod = 'night';
      if (hour >= 5 && hour < 12) currentPeriod = 'morning';
      else if (hour >= 12 && hour < 17) currentPeriod = 'afternoon';
      else if (hour >= 17 && hour < 22) currentPeriod = 'evening';

      // If the user has >= 30% of their interactions in the current period, add boost
      const total =
        (prefs.morning || 0) +
        (prefs.afternoon || 0) +
        (prefs.evening || 0) +
        (prefs.night || 0);
      if (total > 0 && prefs[currentPeriod] / total > 0.3) {
        timeOfDayBoost = 0.05; // 5% boost for context match
      }
    }

    // Diversity handling
    const diversity = userProfile
      ? (userProfile.categoryDiversity as number) || 0
      : 0;

    const predictions = destinations.map((dest) => {
      let score = 0;
      const cat = dest.category?.toLowerCase() || '';

      if (cat.includes('cultur')) score = features?.cultural_score || 0;
      else if (cat.includes('adventur')) score = features?.adventure_score || 0;
      else if (cat.includes('relax')) score = features?.relaxation_score || 0;
      else
        score =
          ((features?.cultural_score || 0) + (features?.adventure_score || 0)) /
          2; // Default mock average

      // Feature: Destination Popularity Trend
      const popularity = Number(popularityMap.get(dest.id) || 0);
      const popBoost = Math.min(popularity * 0.01, 0.15); // Max 15% boost from popularity

      let normalizedScore =
        0.5 + Number(score) * 0.05 + popBoost + timeOfDayBoost;

      // Feature: Category Diversity smoothing
      // E.g., if diversity is high (>0.8), we bring the score closer to 0.7 to avoid pigeonholing
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

    const result = { recommendations: predictions };

    // Cache the response
    this.predictionCache.set(cacheKey, { data: result, timestamp: Date.now() });

    // Optional: Cleanup cache if it gets too large
    if (this.predictionCache.size > 1000) {
      const oldestKey = this.predictionCache.keys().next().value;
      if (oldestKey) this.predictionCache.delete(oldestKey);
    }

    return result;
  }
}
