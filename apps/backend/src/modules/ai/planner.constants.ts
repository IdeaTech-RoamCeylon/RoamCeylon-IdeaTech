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

// Algorithm constants (for reference - DO NOT MODIFY)
export const LOCKED_ALGORITHM = Object.freeze({
  // Confidence thresholds
  CONFIDENCE_HIGH: 0.8,
  CONFIDENCE_MEDIUM: 0.5,
  CONFIDENCE_MIN: 0.55,
  
  // Scoring multipliers
  MULTIPLIER_HIGH: 1.15,
  MULTIPLIER_MEDIUM: 1.0,
  MULTIPLIER_LOW: 0.85,
  
  // Proximity boosts
  BOOST_TITLE: 0.30,
  BOOST_METADATA: 0.20,
  BOOST_CONTENT: 0.15,
  BOOST_COMBO: 0.10,
  
  // Activity limits
  MAX_ACTIVITIES_TOTAL: 15,
  MAX_PER_DAY_SHORT_TRIP: 2,
  MAX_PER_DAY_LONG_TRIP: 4,
  
  // Diversity controls
  CATEGORY_DIVISOR: 4,
  EMERGENCY_FILL_THRESHOLD: 0.6,
  
  // Scoring cap
  MAX_PRIORITY_SCORE: 2.0,
});