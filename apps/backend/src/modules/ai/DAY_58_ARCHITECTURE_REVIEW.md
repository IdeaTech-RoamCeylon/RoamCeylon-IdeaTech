# Backend Architecture Review — Day 58

**Date:** March 18, 2026  
**Sprint:** Month 3, Day 58 (Day 15)  
**Reviewed by:** Backend Team  
**Version under review:** `backend-v3.1-month3`

---

## Overview

This document evaluates the RoamCeylon backend across four dimensions: API performance, database query efficiency, caching effectiveness, and monitoring pipeline. Based on findings, we confirm scalability headroom and flags areas for Month 4 improvement.

---

## 1. API Performance

### Current State

| Component | Configuration | Assessment |
|-----------|--------------|------------|
| Rate limiting | `ThrottlerModule`: 60 req/min per client | ✅ Good for current load |
| Request timeout | `/ai/*` endpoints: 60s, all others: 30s | ✅ AI-aware differentiation |
| Slow request threshold | Warn on > 500ms (`LoggingInterceptor`) | ✅ Active |
| Global validation | `ValidationPipe` (whitelist + transform) | ✅ Input safety enforced |
| CORS | Open (`origin: true`) | ⚠️ Permissive — tighten for production |

### Findings
- **Synchronous AI pipeline**: `POST /ai/trip-plan-enhanced` runs the entire ranking, scoring, and plan generation synchronously within the HTTP request. At current scale this is fine (< 1,150ms avg), but it will become a bottleneck under high concurrency.
- **No request queuing**: Concurrent AI requests from multiple users share the same event-loop thread with no back-pressure mechanism.
- **Rate limit scope**: Current throttler is per-IP, which is adequate for MVP but doesn't distinguish authenticated users from anonymous traffic.

### Scalability Assessment
✅ **Can scale further under current patterns.** The stateless NestJS server can horizontally scale behind a load balancer. The synchronous AI handler will need async queuing before reaching production traffic levels.

---

## 2. Database Query Efficiency

### Current State

| Area | Pattern | Assessment |
|------|---------|------------|
| ORM | Prisma with PostgreSQL + pgvector | ✅ Type-safe, structured |
| Analytics 7-day loop | 7 sequential `count()` queries in a loop | ⚠️ N+1 — can be replaced with one `GROUP BY` query |
| Avg latency | Raw SQL `AVG(CAST(...))` | ✅ Efficient aggregation |
| Feedback aggregation | `findMany()` on full table for category filtering | ⚠️ Full table scan — needs server-side filtering |
| Duplicate guard | Prisma unique-constraint catch (P2002) | ✅ Idempotency handled |
| Vector search | pgvector with cosine similarity | ✅ Indexed |

### Findings
- **N+1 in `getPlannerDailyStats()`**: The `last7Days` loop issues 7 independent `count()` queries. Replacing with a single `GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')` query would reduce DB round trips by 7×.
- **Full-table scan in `aggregateByCategory()`**: All `plannerFeedback` rows are fetched into memory, then filtered in JavaScript. At scale this is a memory and bandwidth problem.
- **No read replicas**: All queries — including analytics aggregations — hit the primary DB.

### Scalability Assessment
✅ Current load is manageable. The N+1 patterns and full-table scans are flagged as pre-production optimizations. Adding DB indexes on `(eventType, timestamp)` and `(tripId)` columns would yield immediate gains.

---

## 3. Caching Effectiveness

### Current State

| Area | Implementation | TTL | Assessment |
|------|---------------|-----|------------|
| Feedback aggregation (trip) | `cache-manager` in-memory | 60s | ✅ Active |
| Feedback aggregation (destination) | `cache-manager` in-memory | 60s | ✅ Active |
| Feedback aggregation (category) | `cache-manager` in-memory | 60s | ✅ Active |
| AI search results | ❌ None | — | ⚠️ Missing |
| Analytics endpoints | ❌ None | — | ⚠️ Missing |
| Trip plans | ❌ None | — | ⚠️ Missing |
| Cache backend | In-memory (`cache-manager` default) | — | ⚠️ Not shared across instances |

### Findings
- **Good**: `PlannerAggregationService` uses `CACHE_MANAGER` correctly with cache-miss logging and explicit invalidation on write.
- **Gap 1**: AI vector search results are not cached. Repeated queries for the same destination + preferences re-compute the embedding and re-run the pgvector search every time.
- **Gap 2**: Analytics dashboard endpoints (`/analytics/planner/daily`, `/analytics/system/health`) query the DB on every HTTP request with no caching.
- **Gap 3**: In-memory cache is **not shared** across multiple server instances. Horizontal scaling would result in cold caches per pod.

### Scalability Assessment
⚠️ **Caching must be upgraded before horizontal scaling.** Moving from in-memory to a shared Redis cache (`@nestjs/cache-manager` with `cache-manager-redis-store`) is the critical prerequisite for multi-instance deployments.

---

## 4. Monitoring Pipeline

### Current State

| Component | Implementation | Assessment |
|-----------|---------------|------------|
| HTTP request logging | `LoggingInterceptor` (NestJS Logger) | ✅ Per-request with duration |
| Slow request alerts | `> 500ms` warn in interceptor + middleware | ✅ Active |
| Analytics ingestion | `AnalyticsMiddleware` fire-and-forget DB write | ✅ Non-blocking |
| Planner metrics | `planner_generated` events with `durationMs` | ✅ Time-series in DB |
| System health endpoint | `GET /analytics/system/health` | ✅ Error rate + avg latency |
| Error tracking | `api_error` events in `SystemMetric` table | ✅ Queryable |
| Scheduled jobs | `@nestjs/schedule` registered | ✅ Scheduler infrastructure present |
| External alerting | ❌ None | ⚠️ No PagerDuty/Slack webhook integration |
| Distributed tracing | ❌ None | ⚠️ No OpenTelemetry / trace IDs |

### Findings
- **Solid foundation**: The analytics middleware captures every request with response time, status code, and slow-request flags. This feeds the dashboard endpoints.
- **Gap**: No external alerting — when error rate exceeds 5%, `getSystemHealth()` returns `status: 'degraded'`, but nothing proactively notifies anyone.
- **Gap**: No correlation IDs / trace IDs across service boundaries. Multi-service debugging is manual today.

### Scalability Assessment
✅ Monitoring pipeline is functional for current single-instance deployment. External alerting and distributed tracing are required for production-grade observability.

---

## Scalability Confirmation

**Can the system scale further?** ✅ **Yes, with the following constraints:**

| Area | Current Headroom | Blocker for Further Scale |
|------|-----------------|--------------------------|
| API layer | ✅ Stateless — supports horizontal scale | Synchronous AI handler needs queuing |
| Database | ✅ PostgreSQL scales with replicas + indexes | N+1 patterns to fix pre-production |
| Caching | ⚠️ In-memory only | Must migrate to Redis before multi-instance |
| Monitoring | ✅ Foundation in place | Add external alerting + distributed tracing |

---

*Reviewed by Backend Team · Day 58 · March 18, 2026*
