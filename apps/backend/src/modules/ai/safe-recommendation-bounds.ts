// apps/backend/src/modules/ai/safe-recommendation-bounds.ts
//
// SINGLE SOURCE OF TRUTH for all recommendation safety limits.
//
// PURPOSE:
//   Prevents any single signal (ML score, feedback, preference boost,
//   personalization) from dominating the final recommendation score.
//   Works alongside existing PLANNER_CONFIG limits — does not replace them.
//
// HOW IT FITS:
//   PLANNER_CONFIG  → scoring algorithm constants (frozen v1.0.0)
//   SAFE_BOUNDS     → safety rails on outputs (this file, new task)
//   BoundsEnforcerService → enforces these bounds at runtime
//
// COVERAGE:
//   1. ML influence max     — how much ML can shift a rule-based score
//   2. Feedback impact max  — how much star ratings can move a score
//   3. Min relevance threshold — minimum score to enter itinerary at all
//   4. Hybrid score bounds  — floor/ceiling on the final blended score
//   5. Incremental delta cap — per-session cumulative learning limit

export const SAFE_BOUNDS = Object.freeze({
  // ── 1. ML INFLUENCE ────────────────────────────────────────────────────────
  // Max fraction by which ML score can shift the rule-based score.
  // Example: rule_score=0.80, ML_MAX_SHIFT=0.20 → final cannot exceed 0.96
  //
  // Rationale: ML model is trained on limited data. Rule-based scoring
  // (vector similarity + proximity + preference boost) is the primary signal.
  // ML enriches it — it must not override it.
  ML: {
    // Maximum absolute shift ML can apply to rule score (fraction of rule score)
    MAX_SHIFT_FRACTION: 0.2,

    // Hard floor on ml_score output from MlPredictionService (already 0.1 in code)
    MIN_OUTPUT_SCORE: 0.1,

    // Hard ceiling on ml_score output from MlPredictionService (already 0.99 in code)
    MAX_OUTPUT_SCORE: 0.99,

    // In hybrid blending: ML weight cannot exceed this fraction of the total blend
    // Current blend is 60/40 (rule/ML). This cap ensures ML never exceeds 40%.
    MAX_HYBRID_WEIGHT: 0.4,

    // Min rule-based score required before ML influence is applied.
    // Below this, ML boost is reduced proportionally.
    MIN_BASE_FOR_ML_BOOST: 0.55,
  } as const,

  // ── 2. FEEDBACK IMPACT ─────────────────────────────────────────────────────
  // Max influence of star ratings (PlannerFeedback) on recommendation scores.
  //
  // Rationale: A user's 5-star rating on one trip should not cause every
  // similar item to score dramatically higher. Feedback refines — it doesn't
  // override relevance.
  FEEDBACK: {
    // Max fraction of base score that feedback can add or subtract
    // Mirrors PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.FEEDBACK_INFLUENCE_MAX
    // but expressed here as the authoritative definition.
    MAX_INFLUENCE_FRACTION: 0.15,

    // Category weight bounds — how far a category's weight can drift
    // from neutral (1.0) based on accumulated feedback.
    // Mirrors feedback-mapping.service.ts CATEGORY_MIN/MAX.
    CATEGORY_WEIGHT_MIN: 0.5,
    CATEGORY_WEIGHT_MAX: 2.0,

    // Trust score bounds — Bayesian prior keeps this in a safe range,
    // but enforce hard floor/ceiling as a safety net.
    TRUST_SCORE_MIN: 0.0,
    TRUST_SCORE_MAX: 1.0,

    // Trust multiplier bounds — how much the trust score can amplify
    // or reduce the category weight in ranking.service.ts.
    // Mirrors TRUST_MIN=0.8, TRUST_MIN+TRUST_RANGE=1.2 in ranking.service.ts.
    TRUST_MULTIPLIER_MIN: 0.7,
    TRUST_MULTIPLIER_MAX: 1.5,

    // Minimum feedbacks required before feedback influences scores at all.
    // Below this, feedback is stored but not applied to ranking.
    MIN_FEEDBACK_FOR_INFLUENCE: 3,
  } as const,

  // ── 3. MINIMUM RELEVANCE THRESHOLD ────────────────────────────────────────
  // Items below this score are excluded from itinerary generation entirely.
  //
  // Rationale: Low-relevance items degrade plan quality. Even if they match
  // user preferences, a weak vector similarity score means the item is not
  // actually a good match for the destination query.
  RELEVANCE: {
    // Hard minimum score for any item to enter itinerary generation.
    // Mirrors PLANNER_CONFIG.CONFIDENCE.MINIMUM = 0.55.
    // Expressed here as the authoritative safety definition.
    MIN_SCORE_FOR_ITINERARY: 0.55,

    // Minimum score for a HIGH confidence label.
    // Below this, item is Medium or Low — cannot be the sole Day 1 activity.
    MIN_HIGH_CONFIDENCE_SCORE: 0.8,

    // If all results fall below this average, plan is flagged as low quality.
    // Mirrors PLANNER_CONFIG.THRESHOLDS.AVG_SCORE_LOW_QUALITY = 0.65.
    AVG_SCORE_LOW_QUALITY_THRESHOLD: 0.65,

    // Minimum fraction of activities in a plan that must be High or Medium
    // confidence. Below this, plan confidence is forced to 'Low'.
    MIN_QUALITY_ACTIVITY_FRACTION: 0.4,
  } as const,

  // ── 4. FINAL SCORE BOUNDS ─────────────────────────────────────────────────
  // Hard floor and ceiling on any final recommendation score after all boosts.
  //
  // Rationale: No score should reach exactly 0 (item becomes invisible) or
  // exceed MAX_PRIORITY (prevents runaway scores from combined boosts).
  SCORE: {
    // Absolute floor — no recommendation score can go below this.
    FLOOR: 0.1,

    // Absolute ceiling — matches PLANNER_CONFIG.SCORING.MAX_PRIORITY.
    CEILING: 2.0,

    // Max total personalization influence as fraction of base score.
    // Mirrors PLANNER_CONFIG.CONSISTENCY.MAX_PERSONALIZATION_INFLUENCE = 0.25.
    MAX_PERSONALIZATION_FRACTION: 0.25,

    // Max combined learning influence (feedback + preference + ML together).
    // Mirrors PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.COMBINED_LEARNING_MAX = 0.25.
    MAX_COMBINED_LEARNING_FRACTION: 0.25,
  } as const,

  // ── 5. INCREMENTAL LEARNING BOUNDS ───────────────────────────────────────
  // Per-session and per-signal limits for IncrementalLearningService.
  //
  // Rationale: Rapid feedback (e.g. user rates 10 trips in a row) should
  // not cause the interest profile to spike. Each session's cumulative
  // delta is capped regardless of how many feedback events fire.
  INCREMENTAL: {
    // Maximum cumulative delta applied to any interest dimension
    // (cultural / adventure / relaxation) in a single session.
    // e.g. 20 positive ratings cannot move culturalScore by more than 0.5
    MAX_SESSION_DELTA_PER_DIMENSION: 0.5,

    // Maximum single-event delta (positive direction).
    // Matches IncrementalLearningService.DELTA_POSITIVE = 0.05.
    MAX_SINGLE_POSITIVE_DELTA: 0.05,

    // Maximum single-event delta (negative direction, expressed as magnitude).
    // Matches IncrementalLearningService.DELTA_NEGATIVE = 0.03.
    MAX_SINGLE_NEGATIVE_DELTA: 0.03,

    // Absolute bounds for UserInterestProfile score dimensions.
    // Matches IncrementalLearningService MIN_SCORE/MAX_SCORE.
    INTEREST_SCORE_MIN: 0.0,
    INTEREST_SCORE_MAX: 20.0,
  } as const,
}) satisfies Record<string, Record<string, number | Record<string, number>>>;

// ── Type exports ─────────────────────────────────────────────────────────────

export type SafeBoundsConfig = typeof SAFE_BOUNDS;

// ── Audit helper (used by BoundsEnforcerService) ─────────────────────────────

export function describeBounds(): Record<string, unknown> {
  return {
    ml: {
      maxShiftFraction: `${(SAFE_BOUNDS.ML.MAX_SHIFT_FRACTION * 100).toFixed(0)}% of rule score`,
      outputRange: `[${SAFE_BOUNDS.ML.MIN_OUTPUT_SCORE}, ${SAFE_BOUNDS.ML.MAX_OUTPUT_SCORE}]`,
      maxHybridWeight: `${(SAFE_BOUNDS.ML.MAX_HYBRID_WEIGHT * 100).toFixed(0)}% of blend`,
      minBaseForBoost: SAFE_BOUNDS.ML.MIN_BASE_FOR_ML_BOOST,
    },
    feedback: {
      maxInfluence: `${(SAFE_BOUNDS.FEEDBACK.MAX_INFLUENCE_FRACTION * 100).toFixed(0)}% of base score`,
      categoryWeightRange: `[${SAFE_BOUNDS.FEEDBACK.CATEGORY_WEIGHT_MIN}, ${SAFE_BOUNDS.FEEDBACK.CATEGORY_WEIGHT_MAX}]`,
      trustScoreRange: `[${SAFE_BOUNDS.FEEDBACK.TRUST_SCORE_MIN}, ${SAFE_BOUNDS.FEEDBACK.TRUST_SCORE_MAX}]`,
      trustMultiplierRange: `[${SAFE_BOUNDS.FEEDBACK.TRUST_MULTIPLIER_MIN}, ${SAFE_BOUNDS.FEEDBACK.TRUST_MULTIPLIER_MAX}]`,
      minFeedbackRequired: SAFE_BOUNDS.FEEDBACK.MIN_FEEDBACK_FOR_INFLUENCE,
    },
    relevance: {
      minScoreForItinerary: SAFE_BOUNDS.RELEVANCE.MIN_SCORE_FOR_ITINERARY,
      minHighConfidenceScore: SAFE_BOUNDS.RELEVANCE.MIN_HIGH_CONFIDENCE_SCORE,
      avgScoreLowQualityAt:
        SAFE_BOUNDS.RELEVANCE.AVG_SCORE_LOW_QUALITY_THRESHOLD,
      minQualityActivityFraction: `${(SAFE_BOUNDS.RELEVANCE.MIN_QUALITY_ACTIVITY_FRACTION * 100).toFixed(0)}%`,
    },
    score: {
      range: `[${SAFE_BOUNDS.SCORE.FLOOR}, ${SAFE_BOUNDS.SCORE.CEILING}]`,
      maxPersonalizationFraction: `${(SAFE_BOUNDS.SCORE.MAX_PERSONALIZATION_FRACTION * 100).toFixed(0)}%`,
      maxCombinedLearning: `${(SAFE_BOUNDS.SCORE.MAX_COMBINED_LEARNING_FRACTION * 100).toFixed(0)}%`,
    },
    incremental: {
      maxSessionDeltaPerDimension:
        SAFE_BOUNDS.INCREMENTAL.MAX_SESSION_DELTA_PER_DIMENSION,
      singleEventDeltaRange: `[−${SAFE_BOUNDS.INCREMENTAL.MAX_SINGLE_NEGATIVE_DELTA}, +${SAFE_BOUNDS.INCREMENTAL.MAX_SINGLE_POSITIVE_DELTA}]`,
      interestScoreRange: `[${SAFE_BOUNDS.INCREMENTAL.INTEREST_SCORE_MIN}, ${SAFE_BOUNDS.INCREMENTAL.INTEREST_SCORE_MAX}]`,
    },
  };
}
