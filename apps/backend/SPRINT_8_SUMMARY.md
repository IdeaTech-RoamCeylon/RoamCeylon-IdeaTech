# Backend Sprint 8 Summary

**Sprint**: Month 3, Sprint 8  
**Dates**: 2026-02-17 → 2026-02-22  
**Status**: ✅ Complete  
**Team**: Backend

---

## Executive Summary

Sprint 8 focused on building a **feedback-driven learning system** for the planner. The sprint delivered feedback APIs, learning weight controls, and bias safeguards — completing the core personalization engine for RoamCeylon.

**Key Deliverables**:
- ✅ Feedback submission API with upsert semantics
- ✅ Trust score computation with time-decay weighting
- ✅ Category weight learning system (per-user personalization)
- ✅ Bias monitoring safeguards with suppression/over-weight detection
- ✅ Aggregation accuracy validation
- ✅ Ranking service with learning-adjusted trip scores

---

## 1. Feedback APIs

### Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/feedback/:tripId` | Submit/update feedback for a trip | ✅ JWT |

### Implementation Details

**File**: [`feedback.service.ts`](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/src/modules/feedback/feedback.service.ts)

- **Upsert semantics**: Prevents duplicate submissions per user per trip (`@@unique([userId, tripId])`)
- **Rating validation**: Enforced at service layer (1–5 range)
- **Downstream processing**: Triggers async trust score + category weight updates via `FeedbackMappingService`

**Schema**: `PlannerFeedback` model with indexed `userId`, `tripId`, `createdAt` fields.

---

## 2. Learning Weight Controls

### Trust Score System

**File**: [`feedback-mapping.service.ts`](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/src/modules/feedback/feedback-mapping.service.ts)

**Algorithm**: Bayesian trust scoring with time-decay

```
trustScore = (weightedPositive + PRIOR) / (weightedPositive + weightedNegative + PRIOR * 2)
decayWeight = e^(-0.02 * daysOld)
```

**Parameters**:
| Parameter | Value | Purpose |
|---|---|---|
| `DECAY_LAMBDA` | 0.02 | Controls how fast old feedback decays |
| `PRIOR` | 2 | Bayesian prior — prevents extreme scores with few feedbacks |
| Trust range | 0.0 – 1.0 | Clamped for safety |

### Category Weight System

| Parameter | Value | Effect |
|---|---|---|
| Positive rating (4–5) | `+0.1` delta | Boosts category weight |
| Negative rating (1–2) | `-0.1` delta | Reduces category weight |
| Neutral rating (3) | `0` delta | No change |
| Minimum weight | `0.5` | Floor — prevents total suppression |
| Maximum weight | `2.0` | Cap — prevents over-amplification |

### Ranking Adjustment

**File**: [`ranking.service.ts`](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/src/modules/feedback/ranking.service.ts)

```
finalScore = baseScore × categoryMultiplier × trustMultiplier
trustMultiplier = 0.8 + 0.4 × (trustScore × confidence)
confidence = feedbackCount / (feedbackCount + CONFIDENCE_K)
```

**Effect**: Users with more reliable feedback history get higher learning influence; new users default to neutral weighting (trustMultiplier ≈ 0.8).

---

## 3. Bias Safeguards

### Bias Monitor Service

**File**: [`bias-monitor.service.ts`](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/src/modules/feedback/bias-monitor.service.ts)

**What it detects**:

| Bias Type | Threshold | Action |
|---|---|---|
| Extreme category suppression | `weight < 0.6` | Logs warning, flags user |
| Over-weighted signals | `weight > 1.8` | Logs warning, flags user |
| Low trust score | `trustScore < 0.2` | Included in bias report |

**Capabilities**:
- `detectUserBias(userId)` — Per-user bias report
- `runSystemBiasScan()` — System-wide scan across all flagged users
- `getBiasSummaryStats()` — Aggregate stats for monitoring dashboards

### Aggregation Accuracy Validation

**File**: [`aggregation-validator.service.ts`](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/src/modules/feedback/aggregation-validator.service.ts)

**What it validates**:
- ✅ Feedback count accuracy (unique constraint verification)
- ✅ Corrupted entries detection (missing/invalid rating field)
- ✅ Trust score discrepancy check (computed vs stored, tolerance: ±0.01)
- ✅ System-wide aggregation report (sample of 20 users)

---

## 4. Learning Metrics Observability

All learning operations now emit structured log lines tagged `[LearningMetrics]`:

| Log Event | Emitted By | Data Included |
|---|---|---|
| Feedback processing | `FeedbackMappingService` | `userId`, `tripId`, `rating`, `category` |
| Trust score update | `FeedbackMappingService` | `positiveWeight`, `negativeWeight`, `computedTrust`, `feedbackCount` |
| Category weight update | `FeedbackMappingService` | `category`, `oldWeight`, `delta`, `newWeight` |
| Ranking execution | `RankingService` | `trustScore`, `confidence`, `trustMultiplier`, `trips count` |
| Per-trip adjustment | `RankingService` | `tripId`, `baseScore`, `finalScore`, `adjustmentMagnitude` |
| Score computation | `RankingService` | Full scoring breakdown |

---

## 5. Test Coverage

| Area | Status | Notes |
|---|---|---|
| Feedback upsert | ✅ | Unique constraint verified |
| Trust score calculation | ✅ | Bayesian formula validated |
| Category weight bounds | ✅ | Min/max clamping tested |
| Bias detection thresholds | ✅ | Suppression + over-weight cases |
| Aggregation accuracy | ✅ | Discrepancy tolerance validated |

---

## 6. Database Changes

No new migrations this sprint. All models already existed:
- `PlannerFeedback` — feedback storage
- `UserFeedbackSignal` — trust scores
- `UserCategoryWeight` — per-category learning weights

---

## 7. Performance Impact

See [PERFORMANCE_BENCHMARK.md](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/PERFORMANCE_BENCHMARK.md) for full analysis.

**Summary**: Learning adds ~4ms average overhead — well within acceptable limits.

---

## 8. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Trust score drift with sparse feedback | Medium | Bayesian prior (PRIOR=2) prevents extremes |
| Category weight extremes | Low | Hard floor (0.5) and cap (2.0) in place |
| Aggregation discrepancy after schema changes | Low | `AggregationValidatorService` detects drift |
| Learning data corrupted by bad clients | Low | Rating validation at API layer |

---

## 9. Sprint 9 Planned Work

- [ ] Cache `UserFeedbackSignal` and `UserCategoryWeight` per user (Redis, TTL 60s)
- [ ] Analytics module: `planner_events`, `feedback_events`, `system_metrics` tables
- [ ] Event logging middleware for API call tracking
- [ ] Aggregation endpoints: `/analytics/planner/daily`, `/analytics/feedback/rate`, `/analytics/system/errors`

---

*Sprint 8 complete. Learning system is production-ready with sufficient safeguards.*
