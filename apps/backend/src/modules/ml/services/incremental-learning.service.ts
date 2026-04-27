// apps/backend/src/modules/ml/services/incremental-learning.service.ts
//
// WHAT THIS DOES:
//   Applies small, fast feature updates immediately after feedback arrives —
//   without waiting for the 12-hour FeatureExtractionService cron job.
//
// HOW IT FITS IN:
//   RecommendationUpdateService already listens to 'feedback.submitted'
//   and broadcasts via WebSocket. This service hooks into the SAME event
//   and updates the ML feature layer so the next prediction uses fresh data.
//
// FLOW:
//   POST /planner/feedback
//     → feedback.service.ts saves PlannerFeedback
//     → emits 'feedback.submitted'
//         → RecommendationUpdateService → WebSocket broadcast (existing)
//         → IncrementalLearningService  → ML feature update (NEW)
//             1. Invalidate MlPredictionService cache for this user
//             2. Update UserInterestProfile with small delta
//             3. Update DestinationCategoryScore popularity signal
//             4. Trigger refreshAllUserFeatures() if user hits 5/10/15... feedbacks

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { MlPredictionService } from './mlPrediction.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackSubmittedEvent {
  userId: string;
  tripId?: string;
  feedbackValue: number; // numeric rating 1–5
  comment?: string;
  category?: string; // e.g. "History", "Beach", "Nature", "Sightseeing"
  destinationId?: string;
  destination?: string; // e.g. "Galle", "Kandy"
}

interface CategoryDelta {
  cultural: number; // maps to UserInterestProfile.culturalScore
  adventure: number; // maps to UserInterestProfile.adventureScore
  relaxation: number; // maps to UserInterestProfile.relaxationScore
}

type UserInterestProfileSafe = {
  culturalScore: number;
  adventureScore: number;
  relaxationScore: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DELTA_POSITIVE = 0.05; // rating >= 4
const DELTA_NEGATIVE = -0.03; // rating <= 2
const DELTA_NEUTRAL = 0.0; // rating = 3

const POPULARITY_POSITIVE = 2;
const POPULARITY_NEGATIVE = -1;

const MIN_SCORE = 0.0;
const MAX_SCORE = 20.0;

const FULL_REFRESH_THRESHOLD = 5;

// ─── Full category → interest dimension mapping ───────────────────────────────
//
// UserInterestProfile has 3 dimensions: cultural / adventure / relaxation.
// All 8 planner categories map into these 3 dimensions as follows:
//
//   History      → cultural    (strong — historical sites)
//   Culture      → cultural    (strong — cultural experiences)
//   Sightseeing  → cultural    (moderate — landmarks, museums)
//   Arrival      → relaxation  (light — first day, easy pace)
//   Nature       → adventure   (strong — outdoors, wildlife)
//   Adventure    → adventure   (strong — active experiences)
//   Beach        → relaxation  (strong — coastal, leisure)
//   Relaxation   → relaxation  (strong — slow travel)

const CATEGORY_DIMENSION_MAP: Record<string, CategoryDelta> = {
  history: { cultural: 1.0, adventure: 0.0, relaxation: 0.0 },
  culture: { cultural: 1.0, adventure: 0.0, relaxation: 0.0 },
  sightseeing: { cultural: 0.7, adventure: 0.1, relaxation: 0.2 },
  arrival: { cultural: 0.2, adventure: 0.1, relaxation: 0.7 },
  nature: { cultural: 0.0, adventure: 1.0, relaxation: 0.0 },
  adventure: { cultural: 0.0, adventure: 1.0, relaxation: 0.0 },
  beach: { cultural: 0.0, adventure: 0.1, relaxation: 0.9 },
  relaxation: { cultural: 0.0, adventure: 0.0, relaxation: 1.0 },
};

// Destination name → interest dimensions
// Used when category is unavailable — fallback to destination-level mapping
const DESTINATION_DIMENSION_MAP: Array<{
  keywords: string[];
  dims: CategoryDelta;
}> = [
  // Cultural triangle — history/culture
  {
    keywords: [
      'kandy',
      'anuradhapura',
      'sigiriya',
      'polonnaruwa',
      'dambulla',
      'jaffna',
      'mihintale',
    ],
    dims: { cultural: 1.0, adventure: 0.0, relaxation: 0.0 },
  },
  // Hill country & national parks — adventure/nature
  {
    keywords: [
      'ella',
      'yala',
      'horton',
      'knuckles',
      'udawalawe',
      'kataragama',
      'nuwara eliya',
      'haputale',
      'habarana',
      'pinnawala',
      'ambuluwawa',
    ],
    dims: { cultural: 0.0, adventure: 1.0, relaxation: 0.0 },
  },
  // South coast & east coast beaches — relaxation
  {
    keywords: [
      'galle',
      'mirissa',
      'unawatuna',
      'hikkaduwa',
      'bentota',
      'trincomalee',
      'nilaveli',
      'uppuveli',
      'arugam',
      'weligama',
      'matara',
    ],
    dims: { cultural: 0.0, adventure: 0.0, relaxation: 1.0 },
  },
  // Multi-interest destinations — mixed
  {
    keywords: ['colombo', 'negombo'],
    dims: { cultural: 0.5, adventure: 0.2, relaxation: 0.3 },
  },
];

@Injectable()
export class IncrementalLearningService {
  private readonly logger = new Logger(IncrementalLearningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlPredictionService: MlPredictionService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LISTENER
  // ═══════════════════════════════════════════════════════════════════════════

  @OnEvent('feedback.submitted')
  async onFeedbackSubmitted(data: FeedbackSubmittedEvent): Promise<void> {
    const { userId, feedbackValue, category, destinationId, destination } =
      data;

    this.logger.log(
      `[IncrementalLearning] Signal received: userId=${userId} ` +
        `rating=${feedbackValue} category=${category ?? 'unknown'} ` +
        `dest=${destination ?? destinationId ?? 'unknown'}`,
    );

    const t0 = Date.now();

    try {
      await Promise.allSettled([
        Promise.resolve(this.invalidatePredictionCache(userId)),
        this.updateInterestProfile(
          userId,
          category,
          destination,
          feedbackValue,
        ),
        this.updateDestinationPopularity(
          destinationId ?? destination ?? '',
          category ?? '',
          feedbackValue,
        ),
      ]);

      await this.maybeRefreshAllFeatures(userId);
    } catch (err) {
      this.logger.error(
        `[IncrementalLearning] onFeedbackSubmitted error: ${(err as Error).message}`,
      );
    }

    this.logger.log(
      `[IncrementalLearning] Signal applied in ${Date.now() - t0}ms for userId=${userId}`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Cache Invalidation
  // ═══════════════════════════════════════════════════════════════════════════

  private invalidatePredictionCache(userId: string): void {
    const cache = this.mlPredictionService.getCache();
    let count = 0;

    for (const key of cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        cache.delete(key);
        count++;
      }
    }

    this.logger.log(
      `[IncrementalLearning] Cache: invalidated ${count} entries for userId=${userId}`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Update UserInterestProfile
  // ═══════════════════════════════════════════════════════════════════════════

  private async updateInterestProfile(
    userId: string,
    category: string | undefined,
    destination: string | undefined,
    rating: number,
  ): Promise<void> {
    try {
      const delta = this.computeDelta(rating);
      if (delta === 0) {
        this.logger.debug(
          `[IncrementalLearning] Neutral rating ${rating} for userId=${userId} — skipping`,
        );
        return;
      }

      // Category takes priority over destination for dimension mapping
      const dims = category
        ? this.mapCategoryToDimensions(category)
        : this.mapDestinationToDimensions(destination ?? '');

      const existing = (await this.prisma.userInterestProfile.findUnique({
        where: { userId },
        select: {
          culturalScore: true,
          adventureScore: true,
          relaxationScore: true,
        },
      })) as UserInterestProfileSafe | null;

      const newCultural = this.clamp(
        (existing?.culturalScore ?? 0) + dims.cultural * delta,
      );
      const newAdventure = this.clamp(
        (existing?.adventureScore ?? 0) + dims.adventure * delta,
      );
      const newRelaxation = this.clamp(
        (existing?.relaxationScore ?? 0) + dims.relaxation * delta,
      );

      await this.prisma.userInterestProfile.upsert({
        where: { userId },
        create: {
          userId,
          culturalScore: newCultural,
          adventureScore: newAdventure,
          relaxationScore: newRelaxation,
          categoryDiversity: 0,
          timeOfDayPrefs: {},
        },
        update: {
          culturalScore: newCultural,
          adventureScore: newAdventure,
          relaxationScore: newRelaxation,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `[IncrementalLearning] InterestProfile updated: userId=${userId} ` +
          `category=${category ?? destination ?? '?'} ` +
          `delta=${delta >= 0 ? '+' : ''}${delta} ` +
          `dims=${JSON.stringify({ c: dims.cultural, a: dims.adventure, r: dims.relaxation })} ` +
          `→ cultural=${newCultural.toFixed(3)} adventure=${newAdventure.toFixed(3)} relaxation=${newRelaxation.toFixed(3)}`,
      );
    } catch (err) {
      this.logger.warn(
        `[IncrementalLearning] updateInterestProfile failed for ${userId}: ${(err as Error).message}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Update DestinationCategoryScore
  // ═══════════════════════════════════════════════════════════════════════════

  private async updateDestinationPopularity(
    destinationKey: string,
    category: string,
    rating: number,
  ): Promise<void> {
    // Skip neutral ratings and empty keys — not enough signal
    if (!destinationKey || rating === 3) return;

    try {
      const popularityDelta =
        rating >= 4 ? POPULARITY_POSITIVE : POPULARITY_NEGATIVE;

      // Schema-correct upsert — no frequencyScore field (not in schema.prisma)
      await this.prisma.destinationCategoryScore.upsert({
        where: { destinationId: destinationKey },
        create: {
          destinationId: destinationKey,
          category: category.toLowerCase() || 'unknown',
          popularityScore: Math.max(0, popularityDelta),
          // frequencyScore is NOT in schema — omitted
        },
        update: {
          popularityScore: { increment: popularityDelta },
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `[IncrementalLearning] DestinationScore updated: dest=${destinationKey} ` +
          `popularityDelta=${popularityDelta >= 0 ? '+' : ''}${popularityDelta} (rating=${rating})`,
      );
    } catch (err) {
      this.logger.warn(
        `[IncrementalLearning] updateDestinationPopularity failed for ${destinationKey}: ` +
          `${(err as Error).message}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4 — Full Feature Refresh (threshold-triggered)
  // ═══════════════════════════════════════════════════════════════════════════

  private async maybeRefreshAllFeatures(userId: string): Promise<void> {
    try {
      const count = await this.prisma.plannerFeedback.count({
        where: { userId },
      });

      if (count === 0 || count % FULL_REFRESH_THRESHOLD !== 0) return;

      this.logger.log(
        `[IncrementalLearning] Threshold hit at ${count} feedbacks — ` +
          `triggering full feature refresh for userId=${userId}`,
      );

      await this.refreshAllUserFeatures(userId);
    } catch (err) {
      this.logger.warn(
        `[IncrementalLearning] maybeRefreshAllFeatures failed for ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Full recomputation of UserInterestProfile from ALL PlannerFeedback.
   * Uses a manual join to resolve destination names since PlannerFeedback
   * has no Prisma relation to SavedTrip (tripId is a plain string in schema).
   *
   * Exposed publicly for manual triggering via POST /api/ml/incremental/refresh/:userId
   */
  async refreshAllUserFeatures(userId: string): Promise<void> {
    this.logger.log(
      `[IncrementalLearning] Full refresh started for userId=${userId}`,
    );

    try {
      // Step A: fetch all feedback for this user
      const feedbacks = await this.prisma.plannerFeedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      if (!feedbacks.length) {
        this.logger.log(
          `[IncrementalLearning] No feedback found for userId=${userId}`,
        );
        return;
      }

      // Step B: resolve destinations via manual join (no Prisma relation exists)
      const tripIds = feedbacks
        .map((fb) => fb.tripId)
        .filter((id): id is string => Boolean(id));

      const trips = await this.prisma.savedTrip.findMany({
        where: { id: { in: tripIds } },
        select: { id: true, destination: true },
      });

      const tripMap = new Map<string, string>(
        trips.map((t) => [t.id, t.destination]),
      );

      // Step C: accumulate deltas across all feedback
      let culturalTotal = 0;
      let adventureTotal = 0;
      let relaxationTotal = 0;

      for (const fb of feedbacks) {
        const rating = this.extractRating(fb.feedbackValue);
        if (rating === undefined) continue;

        const delta = this.computeDelta(rating);
        if (delta === 0) continue;

        // Use destination name to infer dimensions (no category stored in PlannerFeedback)
        const dest = tripMap.get(fb.tripId)?.toLowerCase() ?? '';
        const dims = this.mapDestinationToDimensions(dest);

        culturalTotal += dims.cultural * delta;
        adventureTotal += dims.adventure * delta;
        relaxationTotal += dims.relaxation * delta;
      }

      // Step D: write clamped totals to DB
      await this.prisma.userInterestProfile.upsert({
        where: { userId },
        create: {
          userId,
          culturalScore: this.clamp(culturalTotal),
          adventureScore: this.clamp(adventureTotal),
          relaxationScore: this.clamp(relaxationTotal),
          categoryDiversity: 0,
          timeOfDayPrefs: {},
        },
        update: {
          culturalScore: this.clamp(culturalTotal),
          adventureScore: this.clamp(adventureTotal),
          relaxationScore: this.clamp(relaxationTotal),
          updatedAt: new Date(),
        },
      });

      // Step E: invalidate cache so next prediction reads fresh profile
      this.invalidatePredictionCache(userId);

      this.logger.log(
        `[IncrementalLearning] Full refresh complete for userId=${userId}: ` +
          `cultural=${this.clamp(culturalTotal).toFixed(3)} ` +
          `adventure=${this.clamp(adventureTotal).toFixed(3)} ` +
          `relaxation=${this.clamp(relaxationTotal).toFixed(3)}`,
      );
    } catch (err) {
      this.logger.error(
        `[IncrementalLearning] refreshAllUserFeatures failed for ${userId}: ${(err as Error).message}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private computeDelta(rating: number): number {
    if (rating >= 4) return DELTA_POSITIVE;
    if (rating <= 2) return DELTA_NEGATIVE;
    return DELTA_NEUTRAL;
  }

  private clamp(value: number): number {
    return Math.min(Math.max(value, MIN_SCORE), MAX_SCORE);
  }

  /**
   * Maps all 8 planner itinerary categories to ML interest dimensions.
   *
   * Supported categories and their mappings:
   *   History     → cultural  1.0
   *   Culture     → cultural  1.0
   *   Sightseeing → cultural  0.7, adventure 0.1, relaxation 0.2
   *   Arrival     → cultural  0.2, adventure 0.1, relaxation 0.7
   *   Nature      → adventure 1.0
   *   Adventure   → adventure 1.0
   *   Beach       → adventure 0.1, relaxation 0.9
   *   Relaxation  → relaxation 1.0
   */
  private mapCategoryToDimensions(category: string): CategoryDelta {
    const key = category.toLowerCase().trim();

    // Direct lookup first
    if (CATEGORY_DIMENSION_MAP[key]) {
      return CATEGORY_DIMENSION_MAP[key];
    }

    // Partial match fallback for compound values like "Arrival & Beach"
    for (const [mapKey, dims] of Object.entries(CATEGORY_DIMENSION_MAP)) {
      if (key.includes(mapKey)) return dims;
    }

    // Default — spread evenly if no match
    this.logger.debug(
      `[IncrementalLearning] Unknown category "${category}" — using even spread`,
    );
    return { cultural: 0.33, adventure: 0.33, relaxation: 0.34 };
  }

  /**
   * Maps destination name to ML interest dimensions.
   * Used in refreshAllUserFeatures() where only the destination name is available.
   */
  private mapDestinationToDimensions(destination: string): CategoryDelta {
    const d = destination.toLowerCase().trim();

    for (const entry of DESTINATION_DIMENSION_MAP) {
      if (entry.keywords.some((kw) => d.includes(kw))) {
        return entry.dims;
      }
    }

    // Unknown destination — spread evenly
    return { cultural: 0.33, adventure: 0.33, relaxation: 0.34 };
  }

  private extractRating(raw: unknown): number | undefined {
    if (typeof raw === 'number') return raw;
    if (raw && typeof raw === 'object' && 'rating' in raw) {
      const r = (raw as { rating: unknown }).rating;
      if (typeof r === 'number') return r;
    }
    return undefined;
  }
}
