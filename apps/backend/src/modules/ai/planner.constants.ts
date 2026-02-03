/**
 * AI Trip Planner - LOCKED v1.0.0
 * Lock Date: 2026-01-16
 *
 * ⚠️ FEATURE FREEZE - Sprint 3 Closure
 * Only critical bug fixes allowed after this point
 */

export const ALGORITHM_VERSION = '1.0.0';
export const LOCK_DATE = '2026-01-16';
export const LOCK_STATUS = 'FROZEN';

export const EXPLANATION_TEMPLATES = {
  TIMING: 'Optimal {timeOfDay} for {activityType}',
  PROXIMITY: 'Only {distance}km from previous stop',
  BALANCE: '{activityType} balances previous {previousType}',
  ENERGY: '{energyLevel} energy level suits this activity',
};

// Algorithm constants - DO NOT MODIFY
export const PLANNER_CONFIG = Object.freeze({
  CONFIDENCE: {
    HIGH: 0.8,
    MEDIUM: 0.5,
    MINIMUM: 0.55,
  } as const,

  SCORING: {
    CONFIDENCE_MULTIPLIERS: {
      High: 1.15,
      Medium: 1.0,
      Low: 0.85,
    } as const,

    PROXIMITY_BOOSTS: {
      TITLE: 0.3,
      METADATA: 0.2,
      CONTENT: 0.15,
      COMBO: 0.1,
    } as const,

    CATEGORY_ALIGNMENT: {
      DIRECT_MATCH: 0.2,
      MAPPED_MATCH: 0.12,
      MAX: 0.4,
    } as const,

    MIN_BASE_SCORE: 0.55,
    LOW_QUALITY_MULTIPLIER: 0.5,
    MAX_PRIORITY: 2.0,

    TRIP_OPTIMIZATION: {
      SHORT_BOOST: 0.08,
      LONG_BOOST: 0.08,
    } as const,
  } as const,

  ACTIVITIES: {
    MAX_PER_DAY_SHORT: 2,
    MAX_PER_DAY_LONG: 4,
    MAX_TOTAL: 15,
  } as const,

  DIVERSITY: {
    CATEGORY_DIVISOR: 4,
    EMERGENCY_THRESHOLD: 0.6,
  } as const,

  TRIP_LENGTH: {
    SHORT_MAX: 2,
    MEDIUM_MAX: 5,
  } as const,

  SEARCH: {
    MIN_QUERY_LENGTH: 3,
    MAX_QUERY_LENGTH: 300,
  } as const,

  THRESHOLDS: {
    AVG_SCORE_LOW_QUALITY: 0.65,
    HIGH_SCORE_COMBO: 0.7,
    PARTIAL_HIGH_CONFIDENCE: 0.5,
  } as const,
  VALIDATION: {
    VAGUE_TERMS: [
      'things',
      'stuff',
      'places',
      'anywhere',
      'something',
      'random',
    ],
    CONFLICTING_PAIRS: [
      ['adventure', 'relaxation'],
      ['nature', 'shopping'],
      ['culture', 'beach'],
      ['nightlife', 'nature'],
    ],
  } as const,
});
