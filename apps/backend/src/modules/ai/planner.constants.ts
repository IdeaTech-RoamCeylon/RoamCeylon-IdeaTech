/**
 * AI Trip Planner - LOCKED v1.0.0
 * Lock Date: 2026-01-16
 *
 * ⚠️ FEATURE FREEZE - Sprint 3 Closure
 * Only critical bug fixes allowed after this point
 */

type ItineraryCategory =
  | 'Arrival'
  | 'Sightseeing'
  | 'Culture'
  | 'History'
  | 'Nature'
  | 'Beach'
  | 'Adventure'
  | 'Relaxation';

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

  PERSONALIZATION: {
    MAX_BOOST: 0.3, // Cap total personalization boost at 30%
    CATEGORY_WEIGHT: 0.15, // Weight for liked categories
    PAST_INTERACTION_WEIGHT: 0.25, // Weight for past places
    MIN_BASE_SCORE: 0.5, // Don't personalize items below this score
  } as const,

  CONSISTENCY: {
    SCORE_PRECISION: 6, // Decimal places for score rounding
    ENABLE_SEED_SORTING: true, // Use deterministic sorting
    MAX_PERSONALIZATION_INFLUENCE: 0.25, // Max % change from personalization
  } as const,

  RANKING: {
    // Interest-based weights
    INTEREST_MATCH: {
      EXACT: 0.35, // Direct interest match (e.g., "beach" in beach activity)
      RELATED: 0.2, // Related category match
      PARTIAL: 0.1, // Partial keyword overlap
    } as const,

    // Pace preferences
    PACE_MODIFIERS: {
      RELAXED: {
        MAX_ACTIVITIES_PER_DAY: 2,
        PREFER_CATEGORIES: [
          'Beach',
          'Relaxation',
          'Nature',
        ] as readonly ItineraryCategory[],
        BOOST: 0.15,
      },
      MODERATE: {
        MAX_ACTIVITIES_PER_DAY: 3,
        PREFER_CATEGORIES: [
          'Sightseeing',
          'Culture',
          'History',
        ] as readonly ItineraryCategory[],
        BOOST: 0.1,
      },
      ACTIVE: {
        MAX_ACTIVITIES_PER_DAY: 4,
        PREFER_CATEGORIES: [
          'Adventure',
          'Nature',
          'Sightseeing',
        ] as readonly ItineraryCategory[],
        BOOST: 0.12,
      },
    } as const,

    // Behavioral signals
    BEHAVIOR_WEIGHTS: {
      FREQUENT_CATEGORY: 0.25, // User often selects this category
      RECENT_SELECTION: 0.15, // Selected in last 30 days
      HIGH_ENGAGEMENT: 0.2, // Spent significant time on this type
      AVOIDED_CATEGORY: -0.3, // User removed this type before
    } as const,
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
