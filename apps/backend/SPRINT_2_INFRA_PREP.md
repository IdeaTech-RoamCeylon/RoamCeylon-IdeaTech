# Sprint 2 Infrastructure Prep: Analysis & Plan

This document identifies key infrastructure requirements, risks, and implementation strategies for Sprint 2.

## 1. Real Authentication Integration Plan

Moving from mock auth to a production-ready JWT system requires robust state management and security.

### Strategy
1.  **OTP Provider**: Integrate **Twilio** (global standard) or a local aggregator (e.g., Dialog/Mobitel gateways via API) for SMS delivery. Development fallback: "Console Log" provider enabled via env var `MOCK_OTP=true`.
2.  **Token Management**:
    *   **Access Token**: Short-lived (15 min), signed stateless JWT. Contains `sub` (userId), `role`, `iat`, `exp`.
    *   **Refresh Token**: Long-lived (7 days), opaque string or signed JWT. **Must be stored in DB (`RefreshToken` table) to allow revocation.**
3.  **Security Measures**:
    *   **Rate Limiting**: Apply `@nestjs/throttler` to `/auth/send-otp` to prevent SMS pumping attacks.
    *   **Hashing**: Store refresh tokens as hashes (prevent leaks if DB compromised), though less critical than passwords.

### Architecture Update
*   *New DB Model*:
    ```prisma
    model RefreshToken {
      id        String   @id @default(uuid())
      tokenHash String
      userId    String
      expiresAt DateTime
      revoked   Boolean  @default(false)
      User      User     @relation(fields: [userId], references: [id])
    }
    ```

---

## 2. Map Data & Logic Plan

We need to support "Ride Hailing" logic without solely relying on expensive external APIs for every query.

### Data Sources
1.  **Routing & Tiles**: Use **Google Maps Platform** or **Mapbox** on the *client-side* for visual maps and A-to-B navigation.
2.  **Driver Matching (Backend)**: Use **PostGIS** for radial searches (`ST_DWithin`). This is local and free.
3.  **Place Data (AI Planner)**:
    *   **Ingestion**: We need a curated dataset of Sri Lankan tourist sites.
    *   **Source**: Automated scraping (Wikipedia/Google Places API limited fetch) -> Clean -> Embedding -> `embeddings` table.
    *   **Plan**: Create a generic `Place` entity that links logic (coordinates) with AI content (description).

### Infrastructure Needs
*   Ensure PostGIS index (`GIST`) is active on `DriverLocation.location`.
*   Validate `pg_trgm` extension for fuzzy text search on place names if needed.

---

## 3. Transport Scaling & Concurrency Concerns

As the transport module moves from "Echo Server" to "Logic Engine", several risks emerge.

### A. State Management (The "Volatile State" Problem)
*   *Risk*: If the backend server restarts (deployment/crash), all in-memory WebSocket state (e.g., "Driver A is offering Ride B") is lost.
*   *Solution*: **Persist State**.
    *   All "Active Rides" must exist in the `RideRequest` table with a status (`PENDING`, `ACCEPTED`).
    *   Driver locations updates are frequent. Writing to Postgres every 3 seconds per driver is viable for <1000 drivers. If scaling beyond, we need **Redis** (Geospatial Index) to buffer updates. *For Sprint 2, Postgres is acceptable.*

### B. Race Conditions (The "Double Booking" Problem)
*   *Risk*: Two drivers tap "Accept" on the same ride simultaneously.
*   *Solution*: Database-level locking or Atomic Updates.
    *   *Prisma Approach*:
        ```typescript
        // Atomic update: Only update if status is still PENDING
        const ride = await prisma.rideRequest.updateMany({
          where: { id: rideId, status: 'PENDING' },
          data: { status: 'ACCEPTED', driverId: driverId }
        });
        if (ride.count === 0) throw new Error("Ride already taken");
        ```

### C. Connection Limits
*   *Risk*: WebSocket connections consume server resources.
*   *Solution*: Stick to a single instance for Sprint 2. For Sprint 3+, use **Redis Adapter** for Socket.io to allow horizontal scaling (multiple backend nodes sharing events).

---

## Summary of Actionable Tasks
1.  **Auth**: Add `RefreshToken` model to Prisma schema. Implement `MOCK_OTP` env toggle.
2.  **Transport**: Write atomic "Driver Accept" logic to prevent race conditions.
3.  **DB**: Verify `GIST` indexes on geometry columns.
