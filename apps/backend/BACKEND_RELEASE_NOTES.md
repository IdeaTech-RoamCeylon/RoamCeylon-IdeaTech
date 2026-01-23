# Backend Release Notes - Sprint 3
**Release Date:** 2026-01-20
**Version:** v3.0.0
**Status:** 🚀 Stable

## 📦 APIs Released
*From API Frozen State (Sprint 3 Final)*

### AI Integration
*   `POST /ai/trip-plan/advanced`: New endpoint for **Advanced Trip Planning**. Supports budget, pace, and multi-day grouping logic.
*   `GET /ai/search/vector`: Optimized hybrid search (Keyword + Vector) for attractions.

### Transport
*   `POST /transport/ride`: New ride request initiation flow.
*   `GET /transport/ride-status`: Real-time polling for ride tracking.
*   `GET /transport/drivers`: Nearby driver search using geospatial queries.

### Core Platform
*   `POST /auth/*`: OTP-based authentication flows.
*   `GET /marketplace/*`: Product catalog and category browsing.

---

## ⚡ Performance Improvements
1.  **Vector Search Optimization**: 
    *   Implemented hybrid filtering (Keyword Gate + Vector Similarity) to reduce noise.
    *   Added metadata filtering (Region/Distance) *before* heavy scoring logic.
2.  **Database Indexing**:
    *   Added `GIST` indexes on `location` columns for `driver_location` and `ride_request` tables to speed up geospatial queries.
    *   Optimized `embeddings` table with `hnsw` index support (via `pgvector` extension) for faster similarity search.
3.  **Caching Strategy**:
    *   Implemented in-memory category caching in `AIController` to avoid re-inferring categories for every result.

---

## 🔒 Security Measures
1.  **Input Validation**:
    *   Global `ValidationPipe` enabled with `{ whitelist: true, transform: true }` to strip illegal properties.
    *   Strict DTO schemas enforced for all write operations (`TripPlanRequestDto`, `CreateTransportDto`).
2.  **Authentication & Authorization**:
    *   `JwtAuthGuard` enforced on all private endpoints (`/transport/*`, `/users/me`).
    *   Exceptions: Public endpoints (`/auth/*`, `/ai/search`) explicitly allowed or throttled.
3.  **Rate Limiting**:
    *   `ThrottlerGuard` applied globally (60 requests/minute).
    *    stricter limits (5 req/min) applied to resource-intensive AI endpoints.
4.  **Logging**:
    *   Production logging level adjusted: Full JSON dumps of AI results moved to `DEBUG` level.
    *   Secrets (DB credentials, API keys) excluded from logs.

---

## ⚠️ Known Backend Risks
1.  **Vector Search Latency**: 
    *   *Risk*: Queries with generic terms (e.g., "hotel") without region filters may scan large portions of the embedding space.
    *   *Mitigation*: Current "Keyword Gate" logic helps, but specific generic queries might still be slow (>500ms).
2.  **Geospatial Query Load**:
    *   *Risk*: `GET /transport/drivers` doing pure radius search on every poll could stress DB if driver count scales >10k.
    *   *Mitigation*: Redis-based geospatial caching is planned for Sprint 4.
3.  **AI Hallucination Fallbacks**: 
    *   *Risk*: If vector search fails or returns low confidence, the fallback logic generates "Discovery Day" placeholders.
    *   *Mitigation*: Frontend should handle these generic placeholders gracefully.

---

## 📝 Deployment Notes
*   **Database Migration**: Ensure `prisma migrate deploy` is run to apply the latest schema changes (Geospatial indexes).
*   **Seeding**: Run `npm run seed` if deploying to a fresh environment to populate initial tourism data and embeddings.
*   **Environment**: Verify `DATABASE_URL` includes the `pgvector` and `postgis` enabled connection string.
