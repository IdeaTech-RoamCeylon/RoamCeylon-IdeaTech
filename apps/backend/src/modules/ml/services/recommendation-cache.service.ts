// apps/backend/src/modules/ml/services/recommendation-cache.service.ts
//
// Two-tier in-process cache:
//   Tier 1 — Recommendation results (TTL: 5 minutes, keyed by userId)
//   Tier 2 — User feature profiles  (TTL: 10 minutes, keyed by userId)
//
// Design decisions:
//   - All public methods are wrapped in try/catch so cache errors NEVER
//     propagate to callers — callers fall through to DB/model on any failure.
//   - LRU-style eviction: when the cache exceeds MAX_SIZE, the oldest entry
//     is dropped (Map preserves insertion order in V8).
//   - No external dependencies — pure in-process, zero Redis setup required.

import { Injectable, Logger } from '@nestjs/common';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecommendationResult {
  user_id: string;
  recommendations: Array<{
    destination_id: string;
    final_score: number;
    ml_score: number;
    rule_score: number;
    source: string;
    reason: string;
  }>;
}

export interface UserFeatureProfile {
  culturalScore: number;
  adventureScore: number;
  relaxationScore: number;
  categoryDiversity?: number;
  timeOfDayPrefs?: Record<string, number>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export interface CacheStats {
  recommendationCache: {
    size: number;
    maxSize: number;
    ttlMs: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
  profileCache: {
    size: number;
    maxSize: number;
    ttlMs: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
  totalEntries: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RecommendationCacheService {
  private readonly logger = new Logger(RecommendationCacheService.name);

  // Recommendation result cache — 5 minutes TTL
  private readonly RECOMMENDATION_TTL_MS = 5 * 60 * 1000;
  private readonly RECOMMENDATION_MAX_SIZE = 2000;
  private readonly recommendationCache = new Map<
    string,
    CacheEntry<RecommendationResult>
  >();

  // User feature profile cache — 10 minutes TTL
  private readonly PROFILE_TTL_MS = 10 * 60 * 1000;
  private readonly PROFILE_MAX_SIZE = 2000;
  private readonly profileCache = new Map<
    string,
    CacheEntry<UserFeatureProfile>
  >();

  // Hit/miss counters
  private recHits = 0;
  private recMisses = 0;
  private profileHits = 0;
  private profileMisses = 0;

  // ── Recommendation Cache ─────────────────────────────────────────────────

  getRecommendation(userId: string): RecommendationResult | null {
    try {
      const entry = this.recommendationCache.get(userId);
      if (!entry) {
        this.recMisses++;
        return null;
      }
      if (Date.now() - entry.timestamp > this.RECOMMENDATION_TTL_MS) {
        this.recommendationCache.delete(userId);
        this.recMisses++;
        return null;
      }
      entry.hits++;
      this.recHits++;
      this.logger.debug(`[RecCache] HIT for userId=${userId}`);
      return entry.data;
    } catch (err) {
      this.logger.warn(
        `[RecCache] get() error — falling through: ${(err as Error).message}`,
      );
      return null;
    }
  }

  setRecommendation(userId: string, data: RecommendationResult): void {
    try {
      this.evictIfNeeded(
        this.recommendationCache,
        this.RECOMMENDATION_MAX_SIZE,
      );
      this.recommendationCache.set(userId, {
        data,
        timestamp: Date.now(),
        hits: 0,
      });
      this.logger.debug(`[RecCache] SET for userId=${userId}`);
    } catch (err) {
      this.logger.warn(
        `[RecCache] set() error — skipping: ${(err as Error).message}`,
      );
    }
  }

  // ── User Feature Profile Cache ───────────────────────────────────────────

  getProfile(userId: string): UserFeatureProfile | null {
    try {
      const entry = this.profileCache.get(userId);
      if (!entry) {
        this.profileMisses++;
        return null;
      }
      if (Date.now() - entry.timestamp > this.PROFILE_TTL_MS) {
        this.profileCache.delete(userId);
        this.profileMisses++;
        return null;
      }
      entry.hits++;
      this.profileHits++;
      this.logger.debug(`[ProfileCache] HIT for userId=${userId}`);
      return entry.data;
    } catch (err) {
      this.logger.warn(
        `[ProfileCache] get() error — falling through: ${(err as Error).message}`,
      );
      return null;
    }
  }

  setProfile(userId: string, data: UserFeatureProfile): void {
    try {
      this.evictIfNeeded(this.profileCache, this.PROFILE_MAX_SIZE);
      this.profileCache.set(userId, {
        data,
        timestamp: Date.now(),
        hits: 0,
      });
      this.logger.debug(`[ProfileCache] SET for userId=${userId}`);
    } catch (err) {
      this.logger.warn(
        `[ProfileCache] set() error — skipping: ${(err as Error).message}`,
      );
    }
  }

  // ── Invalidation ─────────────────────────────────────────────────────────

  /**
   * Invalidates both caches for the given user.
   * Called after feedback events so stale data is evicted immediately.
   */
  invalidate(userId: string): void {
    try {
      this.recommendationCache.delete(userId);
      this.profileCache.delete(userId);
      this.logger.debug(`[Cache] Invalidated all entries for userId=${userId}`);
    } catch (err) {
      this.logger.warn(`[Cache] invalidate() error: ${(err as Error).message}`);
    }
  }

  // ── Observability ─────────────────────────────────────────────────────────

  getCacheStats(): CacheStats {
    const recTotal = this.recHits + this.recMisses;
    const profileTotal = this.profileHits + this.profileMisses;

    return {
      recommendationCache: {
        size: this.recommendationCache.size,
        maxSize: this.RECOMMENDATION_MAX_SIZE,
        ttlMs: this.RECOMMENDATION_TTL_MS,
        hits: this.recHits,
        misses: this.recMisses,
        hitRate:
          recTotal > 0
            ? `${((this.recHits / recTotal) * 100).toFixed(1)}%`
            : '0%',
      },
      profileCache: {
        size: this.profileCache.size,
        maxSize: this.PROFILE_MAX_SIZE,
        ttlMs: this.PROFILE_TTL_MS,
        hits: this.profileHits,
        misses: this.profileMisses,
        hitRate:
          profileTotal > 0
            ? `${((this.profileHits / profileTotal) * 100).toFixed(1)}%`
            : '0%',
      },
      totalEntries: this.recommendationCache.size + this.profileCache.size,
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private evictIfNeeded<T>(cache: Map<string, T>, maxSize: number): void {
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
        this.logger.debug(`[Cache] LRU eviction of key=${oldestKey}`);
      }
    }
  }
}
