# Backend Architecture Walkthrough

## 1. Module Structure (`src/modules`)

The backend is organized into domain-specific modules using NestJS.

*   **`app.module.ts`**: The root module that bundles all feature modules.
*   **Feature Modules**:
    *   **`auth`**: Handles user authentication (OTP flow).
    *   **`transport`**: Manages ride-hailing logic. Key components include:
        *   `TransportGateway`: A WebSocket Gateway (`/socket/rides`) for real-time communication (driver location, ride request/acceptance).
        *   `TransportController`: REST endpoints for ride history/management.
    *   **`ai-planner`**: Powers the AI Trip Planner.
        *   Integrates with LLMs (Gemini).
        *   Uses `pgvector` for RAG-based recommendations.
    *   **`users`**: General user profile management.
    *   **`marketplace`**: (Placeholder) For future local product/service listings.
    *   **`ai`**: Shared AI utilities.

## 2. Database Schema (Prisma + PostgreSQL)

We use **Prisma ORM** with a PostgreSQL database enabled with `PostGIS` and `pgvector` extensions.

### Core Models (`schema.prisma`)
*   **`User`**: Simple identity store (`id`, `phone`, `name`).
*   **`embeddings`**: Stores vector embeddings (`vector(1536)`) for the AI RAG system.
*   **`DriverLocation`**: Stores real-time driver positions using PostGIS `geometry(Point, 4326)` for spatial queries.
*   **`RideRequest`**: Stores ride details including pickup/dropoff coordinates (`geometry(Point, 4326)`).
*   **`SystemMetadata`**: Key-value store for system settings.

## 3. Redis Usage

**Current State**: ❌ Not Implemented.

**Future Plan**: Redis will be introduced in later sprints for:
*   **Queue Management**: Handling high-load tasks (e.g., matching algorithms) using BullMQ.
*   **Pub/Sub**: Scaling WebSockets across multiple server instances (using Redis Adapter for Socket.io).
*   **Caching**: Storing frequently accessed data (fare estimates, user sessions).

## 4. Authentication Mock Logic (`AuthService`)

Currently, the authentication flow is **mocked** for development speed.

*   **`sendOtp(phoneNumber)`**:
    *   Does **NOT** send an actual SMS.
    *   Simply logs the phone number to the console.
    *   Returns `{ message: 'OTP sent successfully' }`.

*   **`verifyOtp(phoneNumber, otp)`**:
    *   Does **NOT** validate the OTP against any database or cache.
    *   Accepts *any* OTP input.
    *   Returns a hardcoded response:
        ```json
        {
          "accessToken": "mock-jwt-token",
          "user": { "id": "mock-user-id", "phoneNumber": "..." }
        }
        ```
    *   **Note**: This means currently *anyone* can log in with *any* OTP. Real JWT generation and validation will be implemented in Sprint 2.
