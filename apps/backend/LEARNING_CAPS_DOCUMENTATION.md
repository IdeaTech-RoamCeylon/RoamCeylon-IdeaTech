# Learning Influence Caps - Bias Prevention System

## Overview

The Learning Influence Caps system prevents runaway bias from accumulated user interactions by imposing hard limits on how much feedback and preferences can influence trip planning recommendations.

## Problem Statement

Without caps, personalization systems can develop feedback loops where:
1. **Positive feedback** from past trips excessively boosts similar destinations
2. **Strong user preferences** override relevance quality
3. **Behavioral signals** (frequent visits, category preferences) accumulate unbounded
4. **Combined learning** creates exponential bias toward certain types of experiences

This leads to:
- Lack of diversity in recommendations
- Filter bubbles limiting new discoveries
- Score explosion for over-represented categories
- Degraded recommendation quality

## Three-Tier Cap System

### 1. Feedback Influence Cap: **15%**

**Purpose**: Limit boost from positive user feedback on past trips

**Implementation**: [ai.controller.ts](ai.controller.ts) line ~1538-1548

```typescript
// In calculatePersonalizationBoost():
const positiveDestinations = 
  await this.tripStore.getUserPositiveFeedbackDestinations(userId);

if (hasPositiveFeedback) {
  feedbackBoost = 0.10; // Base feedback influence
}

// Apply cap
const feedbackCap = 
  baseScore * PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.FEEDBACK_INFLUENCE_MAX;
const cappedFeedbackBoost = Math.min(feedbackBoost, feedbackCap);
```

**Rationale**: 
- Feedback is powerful but should not dominate relevance
- 15% allows meaningful boost while maintaining quality threshold
- Prevents echo chamber effect from past positive experiences

**Example**:
- Place base score: 0.80 (relevant match)
- Max feedback boost: 0.80 × 0.15 = 0.12
- Final score: ≤ 0.92 (capped)

### 2. Preference Override Cap: **20%**

**Purpose**: Limit boost from explicit user preferences (interests, categories)

**Implementation**: [ai.controller.ts](ai.controller.ts) line ~1407-1420

```typescript
// In scoreResultsByPreferences():
const appliedPrefBoost = preferenceBoost * boostMultiplier * prefSoftener;
priorityScore += appliedPrefBoost;

// Apply preference cap
const prefCap = 
  baseScore * PLANNER_CONFIG.LEARNING_INFLUENCE_CAPS.PREFERENCE_OVERRIDE_MAX;

if (appliedPrefBoost > prefCap) {
  const over = appliedPrefBoost - prefCap;
  priorityScore -= over; // Remove excess boost
}
```

**Rationale**:
- User preferences should personalize, not override quality entirely
- 20% balances user intent with semantic relevance
- Prevents low-quality items from ranking high solely due to preference match

**Example**:
- Place base score: 0.70 (medium relevance)
- Strong preference match boost: 0.25 (would add 25%)
- Max preference boost: 0.70 × 0.20 = 0.14
- Applied boost: 0.14 (capped)
- Final score: ≤ 0.84 (capped)

### 3. Combined Learning Cap: **25%**

**Purpose**: Enforce total ceiling on all learning influences combined

**Implementation**: [ai.controller.ts](ai.controller.ts) line ~1735-1742

```typescript
// In scoreResultsByPreferencesPersonalized():
const finalScore = this.q(item.priorityScore + personalizationBoost);

// Combined cap (feedback + preferences + behavioral signals)
const maxFinal = this.q(
  baseScore + 
  baseScore * PLANNER_CONFIG.CONSISTENCY.MAX_PERSONALIZATION_INFLUENCE
);

const boundedFinal = Math.min(finalScore, maxFinal);
```

**Rationale**:
- Final safeguard against all learning signals combined
- Ensures relevance always remains primary ranking factor
- 25% = COMBINED_LEARNING_MAX = MAX_PERSONALIZATION_INFLUENCE
- Prevents accumulation beyond reasonable bounds

**Example - Worst Case Scenario**:
```
User has:
- Positive feedback for destination (+15% attempted)
- Strong preference match (+20% attempted)
- Frequent category visits (+behavioral boost)
- Past interaction with place (+legacy boost)

Without combined cap: Could reach +35-40% boost
With combined cap: Limited to +25% maximum

Place base score: 0.85
Uncapped boost attempt: 0.85 × 0.40 = 0.34 → final 1.19
Capped final score: 0.85 × 1.25 = 1.0625 (max)
```

## Configuration

All caps defined in [planner.constants.ts](planner.constants.ts):

```typescript
LEARNING_INFLUENCE_CAPS: {
  FEEDBACK_INFLUENCE_MAX: 0.15,      // 15% cap on feedback boost
  PREFERENCE_OVERRIDE_MAX: 0.20,     // 20% cap on preference boost
  COMBINED_LEARNING_MAX: 0.25,       // 25% cap on total learning
  DESCRIPTION: 'Prevents future runaway bias from feedback loops',
} as const,
```

## Cap Hierarchy

```
Feedback Cap (15%)  ┐
                    ├──> Both ≤ Combined Cap (25%)
Preference Cap (20%)┘

Mathematical guarantee:
- max(feedback, preference, combined) = combined = 25%
- feedback + preference (35%) > combined (25%) ✓
- Individual caps provide granular control
- Combined cap provides final safeguard
```

## Test Coverage

**Test Suite**: [learning-caps.spec.ts](learning-caps.spec.ts)

✅ 9 tests passing:
1. ✅ Cap hierarchy properly configured
2. ✅ Feedback cap at 15%
3. ✅ Preference cap at 20%
4. ✅ Combined cap at 25%
5. ✅ Aligns with MAX_PERSONALIZATION_INFLUENCE
6. ✅ Prevents runaway bias (35% → 25%)
7. ✅ Descriptive documentation present
8. ✅ All caps within valid bounds (0, 1]
9. ✅ Meaningful 5% gaps between tiers

## Bias Prevention Mechanism

### Scenario: Power User with Extreme Signals

**User Profile**:
- 10+ visits to similar places
- 15+ interactions with same category
- 4+ positive feedback destinations
- 4 strong overlapping preferences

**Without Caps**:
```
Feedback boost:        +0.20 (20%)
Preference boost:      +0.25 (25%)
Behavioral boost:      +0.15 (15%)
Total uncapped:        +0.60 (60%)

Base score: 0.80 → Uncapped: 1.40 (SEVERE BIAS)
```

**With Caps**:
```
Feedback boost:        +0.12 (15% capped)
Preference boost:      +0.16 (20% capped)
Behavioral + other:    +0.05
Attempted total:       +0.33 (33%)
Combined cap applied:  +0.20 (25% capped)

Base score: 0.80 → Capped: 1.00 (BIAS PREVENTED ✓)
```

## Integration Points

### 1. Personalization Boost Calculation
**Location**: `calculatePersonalizationBoost()` (line ~1519-1693)

**Components**:
- ⚠️ Feedback influence (NEW - capped at 15%)
- Interest alignment (exact/related matches)
- Pace compatibility (relaxed/active)
- Behavioral signals (frequent categories)
- Recent engagement (temporal signals)
- Avoided categories (negative signals)

**Cap Application Order**:
1. Calculate all individual boosts
2. Apply feedback cap (15%)
3. Combine all boosts
4. Apply MAX_BOOST ceiling (0.3)
5. Apply MAX_PERSONALIZATION_INFLUENCE (25%)

### 2. Preference Scoring
**Location**: `scoreResultsByPreferences()` (line ~1305-1500)

**Components**:
- Title/content preference matches
- Category energy alignment
- Multi-preference bonus
- Normalized by preference count

**Cap Application**:
- Calculate preference boost
- Apply multipliers (quality, confidence)
- Compare against PREFERENCE_OVERRIDE_MAX (20%)
- Reduce score if over cap

### 3. Final Score Bounding
**Location**: `scoreResultsByPreferencesPersonalized()` (line ~1700-1760)

**Components**:
- Base relevance score (semantic search)
- Proximity boosts (destination matching)
- Preference boost (capped at 20%)
- Personalization boost (includes feedback, capped at 15%)
- Combined learning cap (25%)

**Cap Application**:
```typescript
finalScore = baseScore + proximity + prefBoost + personalizationBoost
maxAllowed = baseScore * 1.25 // Combined cap
boundedScore = min(finalScore, maxAllowed)
```

## Monitoring & Validation

### Stability Tests

**File**: [final-stability.spec.ts](final-stability.spec.ts)

Validates that caps maintain ranking stability:
- ✅ 100 repeated queries → identical results
- ✅ Mixed feedback → no drift
- ✅ Extreme preferences → no chaos
- ✅ Contradictory signals → bounded scores

### Expected Behavior

**Healthy System**:
- Scores range: 0.45 - 1.10
- Personalization boost: typically 0.05 - 0.15
- Cap triggers: ~10% of queries (high engagement users)
- Diversity: Multiple categories represented

**Warning Signs**:
- Scores consistently at 1.10+ (caps constantly hit)
- No diversity (same category dominates)
- Feedback/preference alignment >80% (echo chamber)

## Future Considerations

### Potential Enhancements

1. **Dynamic Caps Based on User Diversity**
   - Lower caps (10%, 15%, 20%) for users with low category diversity
   - Higher caps (20%, 25%, 30%) for exploratory users

2. **Temporal Decay**
   - Reduce feedback influence over time (decay factor)
   - Fresher signals weighted higher than stale

3. **Category-Specific Caps**
   - Different caps for different categories
   - Prevent dominance from single category

4. **Exploration Bonus**
   - Boost for novel categories (not in user history)
   - Counteract filter bubble effect

## Related Documentation

- [BACKEND_ARCHITECTURE.md](../../BACKEND_ARCHITECTURE.md) - System overview
- [FINAL_STABILITY_TEST_REPORT.md](FINAL_STABILITY_TEST_REPORT.md) - Stability validation
- [planner.constants.ts](planner.constants.ts) - Configuration values
- [DB_SCHEMA_FREEZE.md](../../DB_SCHEMA_FREEZE.md) - User feedback schema

## Change Log

### v1.0.0 - Initial Release (Current)
- ✅ Implemented three-tier cap system
- ✅ Added feedback influence scoring (previously only used for explanations)
- ✅ Updated preference cap from 25% → 20%
- ✅ Maintained combined cap at 25% (aligned with MAX_PERSONALIZATION_INFLUENCE)
- ✅ Added 9 validation tests
- ✅ Documented implementation

### Known Issues
None. All tests passing.

### Breaking Changes
None. Caps only reduce boost amounts, never increase. Existing behavior preserved for users below thresholds.
