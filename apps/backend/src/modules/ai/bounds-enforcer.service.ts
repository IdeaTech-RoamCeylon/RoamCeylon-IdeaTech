// apps/backend/src/modules/ai/bounds-enforcer.service.ts
//
// Enforces the limits defined in safe-recommendation-bounds.ts
// at the points where scores are produced or consumed.
//
// INTEGRATION POINTS:
//   1. MlService.getPersonalizedRecommendations()
//      → enforceHybridScore() caps ML influence on the blended score
//
//   2. MlPredictionService.getMLRecommendations()
//      → enforceMlOutputScore() clamps raw ml_score output
//
//   3. ai.controller.ts scoreResultsByPreferencesPersonalized()
//      → enforcePersonalizationBound() already done via PLANNER_CONFIG,
//        but log violations here for observability
//
//   4. GET /ai/bounds/status  (new endpoint in ai.controller.ts)
//      → describeBounds() returns active limits for inspection
//
//   5. IncrementalLearningService
//      → enforceSessionDelta() caps per-session cumulative delta

import { Injectable, Logger } from '@nestjs/common';
import { SAFE_BOUNDS, describeBounds } from './safe-recommendation-bounds';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HybridScoreInput {
  ruleScore:  number;
  mlScore:    number;
  mlWeight:   number;   // fraction — e.g. 0.4 for 40% ML
  ruleWeight: number;   // fraction — e.g. 0.6 for 60% rule
}

export interface HybridScoreResult {
  finalScore:      number;
  mlApplied:       boolean;
  mlWeightUsed:    number;
  cappedByBound:   boolean;
  violationReason: string | null;
}

export interface RelevanceCheckResult {
  passes:       boolean;
  score:        number;
  reason:       string | null;
  confidenceLevel: 'High' | 'Medium' | 'Low';
}

export interface BoundViolation {
  field:    string;
  input:    number;
  clamped:  number;
  bound:    number;
  direction:'above' | 'below';
}

@Injectable()
export class BoundsEnforcerService {
  private readonly logger = new Logger(BoundsEnforcerService.name);

  // Per-session delta tracker for incremental learning
  // Key: userId, Value: { cultural, adventure, relaxation }
  private readonly sessionDeltas = new Map<string, {
    cultural:   number;
    adventure:  number;
    relaxation: number;
  }>();

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ML INFLUENCE — Hybrid Score Enforcement
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enforces the ML influence limit on the hybrid score blending.
   *
   * Called in MlService.getPersonalizedRecommendations() before returning
   * each recommendation's finalScore.
   *
   * If ML would shift the final score by more than MAX_SHIFT_FRACTION of
   * the rule score, the ML weight is reduced until the shift is within bounds.
   *
   * Example:
   *   ruleScore=0.80, mlScore=0.95, mlWeight=0.40
   *   naive blend = 0.80×0.60 + 0.95×0.40 = 0.86
   *   ML shift = 0.86 - 0.80 = 0.06 → 7.5% of ruleScore
   *   MAX_SHIFT_FRACTION=0.20 → 0.80×0.20 = 0.16 allowed
   *   0.06 < 0.16 → no cap needed
   *
   *   But if mlScore=0.99, mlWeight=0.40:
   *   naive blend = 0.80×0.60 + 0.99×0.40 = 0.876
   *   ML shift = 0.876 - 0.80 = 0.076 → still within 16% — passes
   *
   *   If ruleScore=0.50, mlScore=0.99:
   *   naive blend = 0.50×0.60 + 0.99×0.40 = 0.696
   *   ML shift = 0.696 - 0.50 = 0.196 → 39% of ruleScore
   *   MAX_SHIFT_FRACTION=0.20 → max allowed shift = 0.10
   *   Capped final = 0.50 + 0.10 = 0.60
   */
  enforceHybridScore(input: HybridScoreInput): HybridScoreResult {
    const { ruleScore, mlScore, mlWeight, ruleWeight } = input;

    // Clamp inputs first
    const safeRule  = this.clamp(ruleScore, SAFE_BOUNDS.SCORE.FLOOR, SAFE_BOUNDS.SCORE.CEILING);
    const safeMl    = this.clamp(mlScore,   SAFE_BOUNDS.ML.MIN_OUTPUT_SCORE, SAFE_BOUNDS.ML.MAX_OUTPUT_SCORE);
    const safeMlW   = this.clamp(mlWeight,  0, SAFE_BOUNDS.ML.MAX_HYBRID_WEIGHT);
    const safeRuleW = Math.max(0, 1 - safeMlW);

    // Don't apply ML boost if base rule score is too low
    if (safeRule < SAFE_BOUNDS.ML.MIN_BASE_FOR_ML_BOOST) {
      this.logger.debug(
        `[SafeBounds] ML boost skipped: ruleScore=${safeRule.toFixed(3)} below ` +
        `MIN_BASE_FOR_ML_BOOST=${SAFE_BOUNDS.ML.MIN_BASE_FOR_ML_BOOST}`,
      );
      return {
        finalScore:      this.clamp(safeRule, SAFE_BOUNDS.SCORE.FLOOR, SAFE_BOUNDS.SCORE.CEILING),
        mlApplied:       false,
        mlWeightUsed:    0,
        cappedByBound:   false,
        violationReason: null,
      };
    }

    // Naive blend
    const naiveBlend = safeRule * safeRuleW + safeMl * safeMlW;

    // ML shift from rule baseline
    const mlShift         = naiveBlend - safeRule;
    const maxAllowedShift = safeRule * SAFE_BOUNDS.ML.MAX_SHIFT_FRACTION;

    if (mlShift <= maxAllowedShift) {
      // Within bounds — use naive blend
      const finalScore = this.clamp(naiveBlend, SAFE_BOUNDS.SCORE.FLOOR, SAFE_BOUNDS.SCORE.CEILING);
      return {
        finalScore,
        mlApplied:       true,
        mlWeightUsed:    safeMlW,
        cappedByBound:   false,
        violationReason: null,
      };
    }

    // Shift exceeded — cap final to ruleScore + maxAllowedShift
    const cappedFinal = this.clamp(
      safeRule + maxAllowedShift,
      SAFE_BOUNDS.SCORE.FLOOR,
      SAFE_BOUNDS.SCORE.CEILING,
    );

    const reason =
      `ML shift ${mlShift.toFixed(4)} exceeded MAX_SHIFT_FRACTION ` +
      `(${(SAFE_BOUNDS.ML.MAX_SHIFT_FRACTION * 100).toFixed(0)}% = ${maxAllowedShift.toFixed(4)}) ` +
      `of ruleScore ${safeRule.toFixed(3)}. Capped to ${cappedFinal.toFixed(3)}`;

    this.logger.warn(`[SafeBounds] ML influence capped: ${reason}`);

    return {
      finalScore:      cappedFinal,
      mlApplied:       true,
      mlWeightUsed:    safeMlW,
      cappedByBound:   true,
      violationReason: reason,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ML OUTPUT — Score Clamp
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clamps a raw ml_score from MlPredictionService to the valid range.
   * Called before caching and returning from getMLRecommendations().
   */
  enforceMlOutputScore(raw: number, destinationId: string): number {
    const clamped = this.clamp(
      raw,
      SAFE_BOUNDS.ML.MIN_OUTPUT_SCORE,
      SAFE_BOUNDS.ML.MAX_OUTPUT_SCORE,
    );

    if (clamped !== raw) {
      this.logger.warn(
        `[SafeBounds] ml_score clamped for dest=${destinationId}: ` +
        `${raw.toFixed(4)} → ${clamped.toFixed(4)}`,
      );
    }

    return clamped;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FEEDBACK IMPACT — Trust and Category Weight Clamps
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clamps a trust score to the valid [0, 1] range.
   * Called after Bayesian trust score calculation in feedback-mapping.service.ts.
   */
  enforceTrustScore(raw: number, userId: string): number {
    const clamped = this.clamp(
      raw,
      SAFE_BOUNDS.FEEDBACK.TRUST_SCORE_MIN,
      SAFE_BOUNDS.FEEDBACK.TRUST_SCORE_MAX,
    );

    if (clamped !== raw) {
      this.logger.warn(
        `[SafeBounds] trustScore clamped for userId=${userId}: ` +
        `${raw.toFixed(4)} → ${clamped.toFixed(4)}`,
      );
    }

    return clamped;
  }

  /**
   * Clamps a category weight to the valid range.
   * Called after weight delta in feedback-mapping.service.ts updateCategoryWeight().
   * Also ensures the trust multiplier used in ranking.service.ts stays bounded.
   */
  enforceCategoryWeight(raw: number, userId: string, category: string): number {
    const clamped = this.clamp(
      raw,
      SAFE_BOUNDS.FEEDBACK.CATEGORY_WEIGHT_MIN,
      SAFE_BOUNDS.FEEDBACK.CATEGORY_WEIGHT_MAX,
    );

    if (clamped !== raw) {
      this.logger.warn(
        `[SafeBounds] categoryWeight clamped for userId=${userId} category=${category}: ` +
        `${raw.toFixed(4)} → ${clamped.toFixed(4)}`,
      );
    }

    return clamped;
  }

  /**
   * Clamps the trust multiplier used in ranking.service.ts.
   * Called in computeTripScore() and rankTrips().
   */
  enforceTrustMultiplier(raw: number, userId: string): number {
    const clamped = this.clamp(
      raw,
      SAFE_BOUNDS.FEEDBACK.TRUST_MULTIPLIER_MIN,
      SAFE_BOUNDS.FEEDBACK.TRUST_MULTIPLIER_MAX,
    );

    if (clamped !== raw) {
      this.logger.warn(
        `[SafeBounds] trustMultiplier clamped for userId=${userId}: ` +
        `${raw.toFixed(4)} → ${clamped.toFixed(4)}`,
      );
    }

    return clamped;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MINIMUM RELEVANCE THRESHOLD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Checks whether a search result meets the minimum relevance threshold
   * for inclusion in itinerary generation.
   *
   * Called in generateItinerary() before processing each result.
   * Returns a structured result with the reason for pass/fail.
   */
  enforceRelevanceThreshold(
    score: number,
    title: string,
  ): RelevanceCheckResult {
    const passes = score >= SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY;

    let confidenceLevel: 'High' | 'Medium' | 'Low';
    if (score >= SAFE_BOUNDS.RELEVANCE.MIN_HIGH_CONFIDENCE_SCORE) {
      confidenceLevel = 'High';
    } else if (score >= SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY) {
      confidenceLevel = 'Medium';
    } else {
      confidenceLevel = 'Low';
    }

    if (!passes) {
      this.logger.debug(
        `[SafeBounds] Relevance threshold FAILED for "${title}": ` +
        `score=${score.toFixed(4)} < MIN=${SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY}`,
      );
    }

    return {
      passes,
      score,
      reason: passes
        ? null
        : `Score ${score.toFixed(4)} below minimum relevance threshold ` +
          `${SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY}`,
      confidenceLevel,
    };
  }

  /**
   * Validates overall plan quality — checks if enough activities
   * meet the quality fraction threshold.
   *
   * Returns a warning message if plan quality is insufficient.
   */
  validatePlanQuality(activities: Array<{ score: number }>): {
    isQualityPlan: boolean;
    avgScore:      number;
    qualityFraction: number;
    warning:       string | null;
  } {
    if (!activities.length) {
      return {
        isQualityPlan:   false,
        avgScore:        0,
        qualityFraction: 0,
        warning:         'No activities to evaluate',
      };
    }

    const avgScore = activities.reduce((sum, a) => sum + a.score, 0) / activities.length;

    const qualityCount = activities.filter(
      (a) => a.score >= SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY,
    ).length;
    const qualityFraction = qualityCount / activities.length;

    const isQualityPlan =
      avgScore        >= SAFE_BOUNDS.RELEVANCE.AVG_SCORE_LOW_QUALITY_THRESHOLD &&
      qualityFraction >= SAFE_BOUNDS.RELEVANCE.MIN_QUALITY_ACTIVITY_FRACTION;

    const warning = isQualityPlan
      ? null
      : `Plan quality below threshold: avgScore=${avgScore.toFixed(3)} ` +
        `qualityFraction=${(qualityFraction * 100).toFixed(1)}%`;

    if (warning) {
      this.logger.warn(`[SafeBounds] Plan quality issue: ${warning}`);
    }

    return { isQualityPlan, avgScore, qualityFraction, warning };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. INCREMENTAL LEARNING — Session Delta Cap
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Tracks cumulative delta per user session and caps it at
   * MAX_SESSION_DELTA_PER_DIMENSION.
   *
   * Called in IncrementalLearningService before applying any delta.
   * Returns the safe (possibly reduced) delta to apply.
   *
   * Reset sessionDeltas by calling clearSessionDeltas(userId) when
   * the session ends or when a full refresh runs.
   */
  enforceSessionDelta(
    userId: string,
    dimension: 'cultural' | 'adventure' | 'relaxation',
    proposedDelta: number,
  ): number {
    if (!this.sessionDeltas.has(userId)) {
      this.sessionDeltas.set(userId, { cultural: 0, adventure: 0, relaxation: 0 });
    }

    const session   = this.sessionDeltas.get(userId)!;
    const current   = session[dimension];
    const maxDelta  = SAFE_BOUNDS.INCREMENTAL.MAX_SESSION_DELTA_PER_DIMENSION;

    // How much room remains in this session for this dimension
    const remaining = maxDelta - Math.abs(current);

    if (remaining <= 0) {
      this.logger.warn(
        `[SafeBounds] Session delta cap reached for userId=${userId} ` +
        `dimension=${dimension}: cumulative=${current.toFixed(3)} cap=${maxDelta}`,
      );
      return 0; // No more delta allowed this session
    }

    // Clamp proposed delta to remaining room
    const safeDelta = proposedDelta >= 0
      ? Math.min(proposedDelta, remaining)
      : Math.max(proposedDelta, -remaining);

    // Accumulate
    session[dimension] += safeDelta;

    if (safeDelta !== proposedDelta) {
      this.logger.warn(
        `[SafeBounds] Session delta reduced for userId=${userId} ` +
        `dimension=${dimension}: ${proposedDelta.toFixed(4)} → ${safeDelta.toFixed(4)} ` +
        `(cumulative=${session[dimension].toFixed(3)})`,
      );
    }

    return safeDelta;
  }

  /**
   * Resets session delta tracking for a user.
   * Call this after refreshAllUserFeatures() runs.
   */
  clearSessionDeltas(userId: string): void {
    this.sessionDeltas.delete(userId);
    this.logger.debug(`[SafeBounds] Session deltas cleared for userId=${userId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. FINAL SCORE CLAMP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Hard clamp on any final recommendation score.
   * Last line of defense before a score reaches the response.
   *
   * Called at the end of scoring pipelines in ai.controller.ts
   * and ranking.service.ts.
   */
  enforceFinalScore(score: number, context: string): number {
    const clamped = this.clamp(score, SAFE_BOUNDS.SCORE.FLOOR, SAFE_BOUNDS.SCORE.CEILING);

    if (clamped !== score) {
      this.logger.warn(
        `[SafeBounds] Final score clamped [${context}]: ` +
        `${score.toFixed(4)} → ${clamped.toFixed(4)}`,
      );
    }

    return clamped;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. BOUNDS INSPECTION (used by GET /ai/bounds/status endpoint)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns all active bounds for runtime inspection.
   * Used by the status endpoint in ai.controller.ts.
   */
  getActiveBounds(): Record<string, unknown> {
    return describeBounds();
  }

  /**
   * Validates a set of scores against all bounds and returns any violations.
   * Useful for testing and monitoring.
   */
  auditScores(scores: Array<{ id: string; score: number; mlScore?: number; ruleScore?: number }>): {
    violations: BoundViolation[];
    summary: string;
  } {
    const violations: BoundViolation[] = [];

    for (const item of scores) {
      // Check final score bounds
      if (item.score < SAFE_BOUNDS.SCORE.FLOOR) {
        violations.push({
          field:     `score[${item.id}]`,
          input:     item.score,
          clamped:   SAFE_BOUNDS.SCORE.FLOOR,
          bound:     SAFE_BOUNDS.SCORE.FLOOR,
          direction: 'below',
        });
      }
      if (item.score > SAFE_BOUNDS.SCORE.CEILING) {
        violations.push({
          field:     `score[${item.id}]`,
          input:     item.score,
          clamped:   SAFE_BOUNDS.SCORE.CEILING,
          bound:     SAFE_BOUNDS.SCORE.CEILING,
          direction: 'above',
        });
      }

      // Check ml_score bounds
      if (item.mlScore !== undefined) {
        if (item.mlScore < SAFE_BOUNDS.ML.MIN_OUTPUT_SCORE) {
          violations.push({
            field:     `mlScore[${item.id}]`,
            input:     item.mlScore,
            clamped:   SAFE_BOUNDS.ML.MIN_OUTPUT_SCORE,
            bound:     SAFE_BOUNDS.ML.MIN_OUTPUT_SCORE,
            direction: 'below',
          });
        }
        if (item.mlScore > SAFE_BOUNDS.ML.MAX_OUTPUT_SCORE) {
          violations.push({
            field:     `mlScore[${item.id}]`,
            input:     item.mlScore,
            clamped:   SAFE_BOUNDS.ML.MAX_OUTPUT_SCORE,
            bound:     SAFE_BOUNDS.ML.MAX_OUTPUT_SCORE,
            direction: 'above',
          });
        }
      }

      // Check relevance threshold
      if (item.score < SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY) {
        violations.push({
          field:     `relevance[${item.id}]`,
          input:     item.score,
          clamped:   SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY,
          bound:     SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY,
          direction: 'below',
        });
      }
    }

    return {
      violations,
      summary: violations.length === 0
        ? `All ${scores.length} scores within safe bounds`
        : `${violations.length} bound violation(s) detected across ${scores.length} scores`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}