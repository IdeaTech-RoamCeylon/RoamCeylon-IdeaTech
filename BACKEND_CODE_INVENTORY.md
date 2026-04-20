# Backend Codebase Inventory: ML, Feedback & Event Patterns

## 1. Recommendation Endpoints & Services

### REST API Endpoints

| Endpoint | Method | Service | Purpose |
|----------|--------|---------|---------|
| `/api/recommendations/personalized` | `GET` | `MlService` | Returns hybrid ML + rule-based recommendations for a user |
| `/api/ml/recommendations` | `POST` | `MlPredictionService` | Raw ML predictions with features and destination data |
| `/api/behavior/track` | `POST` | `MlService.trackBehavior()` | Records user behavior events (clicks, views, edits, etc.) |

### Core Services

**File: [apps/backend/src/modules/ml/ml.service.ts](apps/backend/src/modules/ml/ml.service.ts)**
- **Class:** `MlService` (Injectable)
- **Key Methods:**
  - `trackBehavior(dto)` — Creates `UserBehaviorEvent` entries in Prisma
  - `getPersonalizedRecommendations(userId)` — Orchestrates hybrid ranking:
    - Fetches rule-based recommendations (mock: 2 hardcoded trips)
    - 20% of users (hash-based rollout) get ML predictions via `MlPredictionService`
    - Combines scores: Rule 60% + ML 40% = final hybrid score
    - Logs recommendations to `RecommendationLog` table
    - Returns: `{ user_id, recommendations: [{ destination_id, final_score, ml_score, rule_score, source, reason }] }`

**File: [apps/backend/src/modules/ml/services/mlPrediction.service.ts](apps/backend/src/modules/ml/services/mlPrediction.service.ts)**
- **Class:** `MlPredictionService` (Injectable)
- **Key Features:**
  - Accepts `MLPredictionRequest` with `user_id`, optional `user_features`, and `destinations` array
  - **LRU Cache:** 1-hour TTL on predictions (key: `${user_id}:${destinationIds}`)
  - **Feature Extraction:**
    - Reads from `UserInterestProfile`: `culturalScore`, `adventureScore`, `relaxationScore`
    - Falls back to provided `user_features` if no profile exists
  - **Scoring Logic:**
    - Base score: `0.5 + (mlScore * 0.05) + popularityBoost + timeOfDayBoost`
    - Popularity boost: `min(popularity * 0.01, 0.15)`
    - Time-of-day boost: `+0.05` if >30% interactions in current period
    - Diversity damping: If diversity > 0.8, blend toward 0.7 to diversify recommendations
  - Returns: `{ recommendations: [{ destination_id, ml_score }] }`

**Supporting Services:**
- [apps/backend/src/modules/ml/services/featureExtraction.service.ts](apps/backend/src/modules/ml/services/featureExtraction.service.ts) — Generates user features from behavior events
- [apps/backend/src/modules/ml/ml.module.ts](apps/backend/src/modules/ml/ml.module.ts) — Wires up ML, FeatureExtraction, and MlPrediction services

---

## 2. User Tracking: Clicks, Feedback, Preferences

### Behavior Event Tracking

**Event Types (Canonical):**
File: [apps/backend/src/modules/ml/constants/event-types.ts](apps/backend/src/modules/ml/constants/event-types.ts)
```
- 'trip_view'
- 'trip_click'
- 'planner_edit'
- 'preference_update'
- 'recommendation_click'
- 'recommendation_ignore'
```

**Behavior Storage:**
- **Table:** `UserBehaviorEvent` (Prisma)
- **Fields:** `userId`, `eventType`, `itemId`, `metadata` (JSON)
- **Method:** `MlService.trackBehavior(dto: TrackBehaviorDto)` at `/api/behavior/track`
  - Endpoint: **Non-blocking**, always returns `{ success: true, eventId }`
  - Stores in database with optional metadata

### Feedback Submission

**File: [apps/backend/src/modules/feedback/feedback.service.ts](apps/backend/src/modules/feedback/feedback.service.ts)**
- **Method:** `submitFeedback(userId, tripId, rating, category?)`
  - **Rating Range:** 1-5 (required)
  - **Duration:** ≥ 24 hours cooldown between edits (anti-gaming)
  - **Triggers:** 
    - First submission → immediate learning
    - Changed rating after cooldown → immediate learning
    - Changed rating within cooldown → queued for deferred learning
  - **Processing:** Calls `FeedbackMappingService.processFeedback()` to update category weights
  - **Side Effects:** Runs drift detection (async, non-blocking)
  - **Feedback Table:** `PlannerFeedback` with unique constraint on `(userId, tripId)`

### User Preferences Storage

**File: [apps/backend/src/modules/ai/trips/trip-store.service.ts](apps/backend/src/modules/ai/trips/trip-store.service.ts)**

**Methods:**
- `saveUserPreferences(userId, newPreferences: string[])` — Merges interests with existing prefs (accumulates over time)
  - Stores in `User.preferences` as JSON: `{ interests: ["beach", "history", ...] }`
- `getUserCategoryPreferences(userId)` — Queries `UserCategoryWeight` table, returns top 5 categories by count
- `getRecentUserSelections(userId)` — Returns last 30 days of selections from `user_activity_log`
- `logActivityInteraction(interaction: ActivityInteraction)` — Records place selections/removals
- `getUserPositiveFeedbackDestinations(userId)` — Destinations with ratings ≥ 4 from `PlannerFeedback`
- `getUserFrequentPlaces(userId)` — Most frequently selected places (top 5)

**Related Tables:**
- `UserInterestProfile` — Feature vectors (cultural_score, adventure_score, relaxation_score, timeOfDayPrefs, categoryDiversity)
- `UserCategoryWeight` — Category-level multipliers learned from feedback
- `UserFeedbackSignal` — Trust and confidence metrics (positive/negative/neutral counts)

---

## 3. Event Emission Patterns & Event Listeners

### Event Types Emitted

**From Frontend (Mobile):**
File: [RoamCeylon/src/services/analyticsService.ts](RoamCeylon/src/services/analyticsService.ts)
```typescript
- logEvent(event, payload) → POST /analytics/events
- trackTripClicked(tripId)
- trackDestinationViewed(destinationId)
- trackPlannerEdit(tripId, field)
- trackTripAccepted(tripId)
- trackTripRejected(tripId, reason)
- logFeedbackSubmitted(isPositive, reasons)
```

**From Admin Dashboard:**
File: [apps/admin/hooks/useAnalyticsTracker.ts](apps/admin/hooks/useAnalyticsTracker.ts)
```typescript
- trip_clicked
- destination_viewed
- planner_edit
- trip_accepted
- trip_rejected
- recommendation_ignored
- recommendation_saved
- recommendation_disliked
```

### Event Reception & Handling

**Endpoint:** `POST /analytics/events`
File: [apps/backend/src/modules/analytics/analytics.controller.ts](apps/backend/src/modules/analytics/analytics.controller.ts)
- **Decorator:** `@HttpCode(HttpStatus.ACCEPTED)` — Fires-and-forgets, always returns `202 Accepted`
- **Processing:** `AnalyticsService.trackEngagementEvent(event, payload)`
  - Non-blocking via `void this.analyticsService.trackEngagementEvent(...)`
  - Stores in `SystemMetric` table with event type prefixed by `engagement_`

**Backend Event Processing:**
File: [apps/backend/src/modules/analytics/analytics.service.ts](apps/backend/src/modules/analytics/analytics.service.ts)
- `recordEvent(category, eventType, userId?, metadata?, eventId?, timestamp?)` — Generic event recorder
  - Categories: `'planner'`, `'feedback'`, `'system'`
  - Logs to appropriate Prisma tables

**Decision Logging:**
File: [apps/backend/src/modules/ai/decision/ai-decision-logger.service.ts](apps/backend/src/modules/ai/decision/ai-decision-logger.service.ts)
- `logTripPlanDecisions(log: TripPlanDecisionLog)` — Captures activity ranking factors
  - Stores raw scores, personalization boosts, preference influence %, feedback influence %
  - Non-blocking via `try/catch`, failures logged but not thrown

---

## 4. WebSocket Gateway Setup (Socket.io)

### Socket.io Configuration

**Installation:** `socket.io` v4.8.1 listed in [apps/backend/package.json](apps/backend/package.json)

**Gateway File:** [apps/backend/src/modules/transport/transport.gateway.ts](apps/backend/src/modules/transport/transport.gateway.ts)

**Decorator:**
```typescript
@WebSocketGateway({
  namespace: 'socket/rides',
  cors: { origin: '*' },
})
```

**Events Implemented:**

| Client → Server | Payload | Handler | Ack |
|-----------------|---------|---------|-----|
| `passenger_request` | `{ origin, destination, timestamp }` | `handlePassengerRequest()` | `passenger_request_ack` |
| `driver_accept` | `{ rideId, driverId }` | `handleDriverAccept()` | `driver_accept_ack` |
| `ride_cancel` | `{ rideId, reason }` | `handleRideCancel()` | `ride_cancel_ack` |

**Server → Client Broadcasting:**
- Currently only logging, not implemented for live rides yet
- Namespace: `/socket/rides`

**Status:** ✅ Basic setup complete, but **NOT SCALED** for production
- ⚠️ No Redis adapter (single-instance only)
- ⚠️ No message queuing
- Marked as scalability risk in [apps/backend/MONTH_2_SUMMARY.md](apps/backend/MONTH_2_SUMMARY.md)

**Recommended Scaling (Month 3):**
- Add `RedisIoAdapter` for cross-instance communication
- Implement reconnection handling
- Use Redis Pub/Sub for broadcast events

---

## 5. Recommendation Logs

### Recommendation Log Storage

**Table:** `RecommendationLog` (Prisma)

**Storage Location:**
Method: [apps/backend/src/modules/ml/ml.service.ts](apps/backend/src/modules/ml/ml.service.ts) `getPersonalizedRecommendations()` → lines 109–126
```typescript
await Promise.all(
  finalRecommendations.map((rec) =>
    prisma.recommendationLog.create({
      data: {
        userId,
        itemId: rec.destination_id,
        score: rec.final_score,
        mlScore: rec.ml_score,
        ruleScore: rec.rule_score,
        finalScore: rec.final_score,
        source: rec.source, // 'hybrid' | 'rule-based' | 'ml'
      }
    })
  )
);
```

**Fields Logged:**
- `userId` — User who received recommendations
- `itemId` — Destination ID
- `score`, `mlScore`, `ruleScore`, `finalScore` — Scoring breakdown
- `source` — Recommendation source: `'hybrid'` (60% rule + 40% ML) | `'rule-based'` | `'ml'`
- `clicked` — Flag updated when user engages (false initially)
- `createdAt` — Timestamp

**Collection Script:**
File: [apps/backend/scripts/collect-training-data.ts](apps/backend/scripts/collect-training-data.ts)
- Fetches recommendation logs with: `userId`, `itemId`, `mlScore`, `ruleScore`, `finalScore`, `clicked`, `createdAt`
- Used to build training records for ML model evaluation

**Analysis & Monitoring:**
- [apps/backend/scripts/evaluate-live-model.ts](apps/backend/scripts/evaluate-live-model.ts) — Compares ML vs rule-based precision@k
- [apps/backend/scripts/compare-model-versions.ts](apps/backend/scripts/compare-model-versions.ts) — Calculates CTR (Click-Through Rate)
- [apps/backend/scripts/hybrid-ranking-feedback-analysis.ts](apps/backend/scripts/hybrid-ranking-feedback-analysis.ts) — Analyzes hybrid ranking stability & feedback signals

---

## 6. User Feedback Processing Endpoints

### Feedback Controller

**Current State:** Feedback endpoints are in `AIController` (not a dedicated feedback controller yet)

File: [apps/backend/src/modules/ai/ai.controller.ts](apps/backend/src/modules/ai/ai.controller.ts)

**Primary Feedback Method:**
- `buildFeedbackSignal(userId?, tripId?)` (private) — Fetches:
  - Previous rating from `PlannerFeedback`
  - Feedback count for trust calculation

**Feedback Integration Points:**

1. **Feedback Submission:**
   - Via `FeedbackService.submitFeedback(userId, tripId, rating, category)`
   - File: [apps/backend/src/modules/feedback/feedback.service.ts](apps/backend/src/modules/feedback/feedback.service.ts)
   - Non-blocking, triggers learning if conditions met

2. **Feedback Mapping:**
   - File: [apps/backend/src/modules/feedback/feedback-mapping.service.ts](apps/backend/src/modules/feedback/feedback-mapping.service.ts)
   - Updates `UserCategoryWeight` table with learned category multipliers
   - Applies to ranking: `categoryMultiplier * baseScore`

3. **Feedback Ranking:**
   - File: [apps/backend/src/modules/feedback/ranking.service.ts](apps/backend/src/modules/feedback/ranking.service.ts) (`FeedbackRankingService`)
   - Used by `AIController` to apply feedback-based boosts to activity scores
   - Calculates influence percentages: preference influence % vs feedback influence %

4. **Feedback Module:**
   - File: [apps/backend/src/modules/feedback/feedback.module.ts](apps/backend/src/modules/feedback/feedback.module.ts)
   - **Exports:** `FeedbackService`, `FeedbackMappingService`, `FeedbackQueueService`, `FeedbackRankingService`

5. **Explanation Building:**
   - File: [apps/backend/src/modules/ai/ai.controller.ts](apps/backend/src/modules/ai/ai.controller.ts) `buildFeedbackExplanation()` (lines ~1100)
   - Generates human-readable explanations of learned adjustments:
     - "Your positive feedback on [category] slightly increased its ranking priority"
     - "Confidence: [X]% based on [N] feedback entries"

### Feedback Flow

```
1. Client sends rating (1-5) → /feedback (implied endpoint, likely via AIController)
2. FeedbackService.submitFeedback() validates & checks cooldown
3. If learning triggered:
   a. FeedbackMappingService updates UserCategoryWeight
   b. Drift detection runs (async)
   c. Cached rankings may be invalidated
4. Next recommendation/ranking request uses updated weights
5. Explanation added to response via buildFeedbackExplanation()
```

### Queue Processing

**File:** [apps/backend/src/modules/feedback/feedback-queue.service.ts](apps/backend/src/modules/feedback/feedback-queue.service.ts)
- Handles deferred learning (feedback submitted within cooldown)
- Queues for processing when cooldown expires
- **Non-blocking:** Never blocks user requests

---

## Summary: Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTIONS                         │
└──────────────┬──────────────────────────────────────────────────┘
               │
     ┌─────────┴─────────┬─────────────┐
     │                   │             │
     v                   v             v
┌──────────────┐  ┌─────────────┐  ┌──────────┐
│ Behavior     │  │ Preference  │  │ Feedback │
│ Events       │  │ Selection   │  │ Ratings  │
│ (clicks,     │  │ (interests) │  │ (1-5)    │
│  views, etc) │  │             │  │          │
└──────────────┘  └─────────────┘  └──────────┘
     │                   │             │
     │ POST /analytics   │ save...     │ submit...
     │ /events           │ UserPrefs   │ Feedback
     │                   │             │
     └─────────────────┬─────────────┴─────────┐
                       │                       │
                       v                       v
            ┌──────────────────────┐  ┌──────────────────┐
            │ UserBehaviorEvent    │  │ PlannerFeedback  │
            │ (Prisma DB)          │  │ UserCategoryWt   │
            └──────────────────────┘  └──────────────────┘
                       │                       │
                       │ (feature extract)     │ (mapping)
                       └───────┬────────────┬──┘
                               │            │
                               v            v
                    ┌──────────────────────────────┐
                    │ Personalized Recommendations │
                    │ GET /api/recommendations/    │
                    │ personalized                 │
                    └──────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        v                      v                      v
    ┌──────────┐          ┌──────────┐          ┌──────────┐
    │ Rule-    │          │   ML     │          │ Hybrid   │
    │ Based    │          │ Prediction          │ Ranking  │
    │ Ranking  │          │ Service  │          │ (60/40)  │
    └──────────┘          └──────────┘          └──────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               v
                    ┌──────────────────────┐
                    │ RecommendationLog    │
                    │ (userId, itemId,     │
                    │  mlScore, ruleScore, │
                    │  source, clicked)    │
                    └──────────────────────┘
                               │
                               v (measurement)
                    ┌──────────────────────┐
                    │ Analytics Dashboard  │
                    │ CTR, Precision@k,    │
                    │ Feedback Signals     │
                    └──────────────────────┘
```

---

## File Tree Reference

### ML Module
```
src/modules/ml/
├── ml.service.ts                    # Orchestrates hybrid ranking & logging
├── ml.controller.ts                 # REST endpoints for recommendations & behavior tracking
├── ml.module.ts                     # Module setup & exports
├── constants/
│   └── event-types.ts               # Canonical event types
├── services/
│   ├── mlPrediction.service.ts      # ML scoring & caching
│   └── featureExtraction.service.ts # User feature generation
└── dto/
    └── track-behavior.dto.ts        # DTO for behavior tracking
```

### Feedback Module
```
src/modules/feedback/
├── feedback.service.ts              # Submission & cooldown logic
├── feedback-mapping.service.ts      # Learns category weights from feedback
├── feedback-queue.service.ts        # Deferred learning queue
├── ranking.service.ts               # Applies feedback to ranking
├── trend-monitoring.service.ts      # Drift detection
├── bias-monitor.service.ts          # Bias detection
├── aggregation-validator.service.ts # Validates aggregations
└── feedback.module.ts               # Module setup
```

### Analytics Module
```
src/modules/analytics/
├── analytics.service.ts             # Event recording & aggregation
├── analytics.controller.ts          # POST /analytics/events
├── analytics.middleware.ts          # Request tracking
├── latency-tracker.service.ts       # Performance monitoring
└── analytics.module.ts              # Module setup
```

### Transport Module (WebSocket)
```
src/modules/transport/
├── transport.gateway.ts             # Socket.io gateway (@WebSocketGateway)
├── transport.service.ts
├── transport.controller.ts
├── transport.module.ts
└── dto/
    └── transport-events.dto.ts      # Event payloads
```

### Trip Store Service
```
src/modules/ai/trips/
├── trip-store.service.ts            # User prefs, category prefs, feedback destinations
└── ...
```

---

## Key Integration Points for Real-Time Feedback

### Current (Synchronous):
1. ✅ Feedback submission → immediate learning
2. ✅ Category weight updates → affects next recommendation immediately
3. ✅ Analytics events → logged synchronously (non-blocking via fire-and-forget POST)

### Needed (Asynchronous/Real-Time):
1. ⚠️ **WebSocket for live ranking updates** — Not yet implemented
2. ⚠️ **Event subscription/listener pattern** — Currently one-way (REST) analytics
3. ⚠️ **Redis Pub/Sub for multi-instance scaling** — Not implemented

### Recommendation for Implementation:
- Emit `RankingUpdated` event when category weights change
- Subscribe in `AIController` to push updates to connected clients via Socket.io
- Use Redis adapter to broadcast across instances (Month 3 roadmap)
