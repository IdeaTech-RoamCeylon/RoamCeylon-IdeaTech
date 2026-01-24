# Month 2 Backend Roadmap

This document summarizes the strategic direction for Month 2, focusing on hardening the platform and enabling core marketplace/transport logic.

## 1. Advanced Authentication Strategy
**Goal**: Move from "Mock Auth" to production-grade security.
*   **Mechanism**: JWT (Access Token) + UUID (Refresh Token) stored in DB.
*   **OTP**: Integrate distinct OTP provider (Twilio or local gateway) with rate limiting (`@nestjs/throttler`).
*   **Role-Based Access**: Implement Guards (`@Roles('DRIVER')`) to secure endpoints.
*   **Reference**: See `SPRINT_2_BACKEND_PLAN.md` (Section 1) and `SPRINT_2_INFRA_PREP.md` (Section 1).

## 2. Transport Enhancements
**Goal**: Real-time ride hailing with geospatial intelligence.
*   **Geospatial Database**: Full leverage of PostGIS for "Find Nearby Drivers" (`ST_DWithin`).
*   **State Management**: Persist active rides in Postgres to handle server restarts.
*   **Race Condition Handling**: Use database-level atomic updates to prevent double-bookings.
*   **Reference**: See `SPRINT_2_BACKEND_PLAN.md` (Section 2).

## 3. Scaling Strategy
**Goal**: Support increasing concurrent users and driver updates.
*   **Immediate Term (Month 2)**:
    *   **Vertical Scaling**: Single instance usage is sufficient for projected load (< 1000 concurrent).
    *   **Optimization**: Use Postgres for state; ensure indices on Geometry columns.
*   **Long Term (Month 3+)**:
    *   **Horizontal Scaling**: Introduce Redis Adapter for Socket.io to allow multiple backend instances.
    *   **High-Frequency Updates**: Move driver location buffers to Redis (Geo) to reduce DB write load.
*   **Reference**: See `SPRINT_2_INFRA_PREP.md` (Section 3).
