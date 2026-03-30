# Infrastructure Improvement Plan — Month 4

**Date:** March 18, 2026  
**Sprint:** Month 3, Day 58  
**Prepares for:** Month 4 Sprint  
**Status:** 📋 PROPOSED

---

## Context

This plan is based on the Day 58 Architecture Review findings. The system is stable at current scale (v2.0 ranking engine frozen, all Day 57 targets met). The following upgrades target production readiness and higher-concurrency workloads.

---

## Upgrade 1: Queue System for AI Processing

### Problem
AI trip planning requests (`POST /ai/trip-plan-enhanced`) are processed synchronously inside the HTTP request lifecycle. Under concurrent load:
- Users experience long polls (up to 60s timeout)
- A single slow external dependency blocks the event loop
- No retry or priority mechanism exists

### Proposed Solution: BullMQ Job Queue

```
Client → POST /ai/trip-plan → HTTP 202 (jobId)
               ↓
         BullMQ Redis Queue  ←→  Worker process(es)
               ↓
         Job result stored / WebSocket / polling
```

**Implementation steps:**
1. Install `@nestjs/bull` + `bull` + `ioredis`
2. Create `AIPlanningQueue` with `@BullModule.registerQueue({ name: 'ai-planning' })`
3. Refactor `AIController.tripPlanEnhanced()` to enqueue a job and return `{ jobId }`
4. Add `GET /ai/trip-plan/status/:jobId` polling endpoint
5. Add `GET /ai/trip-plan/result/:jobId` result endpoint
6. Configure concurrency: 3 workers per instance (safe for pgvector load)
7. Retry strategy: max 2 retries, exponential backoff

**Expected impact:**
- Eliminates 60s timeout risk under load
- Decouples AI computation from HTTP response time
- Enables horizontal scaling of worker processes independently

---

## Upgrade 2: Distributed Service Architecture

### Problem
All modules run in a single NestJS monolith. As traffic grows:
- All modules share the same memory and CPU
- A spike in AI computation affects auth/planner API response times
- No isolation between user-facing APIs and background compute

### Proposed Solution: Microservice Extraction (Phased)

#### Phase 1 — Soft separation (Month 4)
Extract the AI module into a **separate NestJS microservice** communicating via TCP transport (already supported by NestJS):

```
[API Gateway / Main App]
     ├── Auth, Users, Marketplace, Transport (stays in main)
     ├── Planner, Feedback (stays in main, uses DB directly)
     └── AIService client (calls AI microservice via TCP/Redis transport)

[AI Microservice]  ← standalone deployment
     ├── EmbeddingService
     ├── SearchService
     ├── TripStoreService
     └── AIController (renamed to AIGateway internally)
```

**Implementation steps:**
1. Wrap `AIModule` as a `@nestjs/microservices` TCP server on a separate port
2. Replace direct `AIService` injections in main app with `ClientProxy` (NestJS `@Client()`)
3. Define message patterns: `{ cmd: 'plan_trip' }`, `{ cmd: 'search' }`, `{ cmd: 'health' }`
4. Deploy AI microservice separately (own container / process)
5. Configure environment-based host/port resolution

#### Phase 2 — Full extraction (Month 5, if needed)
Extract Analytics as a write-only event stream worker → reduces primary DB write contention.

**Expected impact:**
- AI compute isolated: heavy planners don't degrade auth/planner API latency
- Independent scaling: 2× AI workers spun up during peak hours
- Fault isolation: AI service crash does not take down the entire backend

---

## Upgrade 3: Advanced Caching Layers

### Problem
- Current `cache-manager` uses in-memory store — **not shared across instances**
- AI search results, analytics endpoints, and trip plan data are not cached
- Horizontal scaling (multiple pods) would result in cold caches per instance

### Proposed Solution: Redis-Backed Multi-Layer Cache

#### Layer 1 — Redis shared cache (replaces in-memory)
```bash
npm install cache-manager-redis-store ioredis
```

```typescript
// app.module.ts
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: () => ({
    store: redisStore,
    host: process.env.REDIS_HOST,
    port: 6379,
    ttl: 60, // default 60s
  }),
})
```

**Targets all existing `CACHE_MANAGER` injections** — `PlannerAggregationService` gets Redis automatically.

#### Layer 2 — AI search result cache
Cache `AIController.executeSearch()` results by query fingerprint:
- Cache key: `search:${SHA256(destination + preferences.join(','))}`
- TTL: 5 minutes (place data is stable)
- Invalidation: on new embedding ingestion

#### Layer 3 — Analytics endpoint cache
Cache analytics dashboard responses:
- `GET /analytics/planner/daily` → TTL: 5 min
- `GET /analytics/system/health` → TTL: 30s
- `GET /analytics/feedback/rate` → TTL: 5 min

#### Layer 4 — DB query optimization (removes N+1)
Replace the 7-iteration `last7Days` loop in `getPlannerDailyStats()`:

```sql
-- Current: 7 separate COUNT queries (N+1)
-- Proposed: single GROUP BY
SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') AS day, COUNT(*) AS count
FROM "PlannerEvent"
WHERE "eventType" = 'planner_generated'
  AND "timestamp" >= NOW() - INTERVAL '7 days'
GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
ORDER BY day ASC;
```

**Expected impact:**
- Eliminates cache cold-start problem across instances
- AI search: repeated queries for popular destinations serve from cache in < 1ms
- Analytics dashboard: removes DB hit on every admin page load
- DB: 7× reduction in analytics query count

---

## Implementation Priority (Month 4 Roadmap)

| Priority | Upgrade | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | Redis cache migration (Upgrade 3 Layer 1) | 2 days | Required for horizontal scale |
| 🔴 P0 | Analytics N+1 query fix (Upgrade 3 Layer 4) | 0.5 days | Immediate DB relief |
| 🟡 P1 | AI search result caching (Upgrade 3 Layer 2+3) | 1 day | Latency improvement |
| 🟡 P1 | BullMQ queue for AI planning (Upgrade 1) | 3 days | Concurrency resilience |
| 🟢 P2 | AI microservice extraction (Upgrade 2 Phase 1) | 1 week | Isolation + independent scale |
| 🟢 P2 | External alerting (Slack/PagerDuty webhook) | 1 day | Production observability |
| 🟢 P2 | OpenTelemetry / distributed tracing | 2 days | Multi-service debugging |

---

## Infrastructure Dependencies

| Component | Needed For | Already Available |
|-----------|-----------|-------------------|
| Redis | Upgrades 1 + 3 | ❌ Needs provisioning |
| Load Balancer | Upgrade 2 (multi-instance) | ❌ Likely managed by cloud provider |
| Container orchestration (K8s/ECS) | Upgrade 2 Phase 1 | ❌ Needs setup |
| NestJS Bull / BullMQ | Upgrade 1 | ❌ Not installed |
| OpenTelemetry SDK | Tracing | ❌ Not installed |

---

*Prepared by Backend Team · Day 58 · March 18, 2026*  
*For review in Month 4 Sprint Planning*
