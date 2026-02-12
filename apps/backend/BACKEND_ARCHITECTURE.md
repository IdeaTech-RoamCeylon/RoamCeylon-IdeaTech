# Backend Architecture Walkthrough

## 1. Module Structure (`src/modules`)

The backend is organized into domain-specific modules using NestJS.

- **`app.module.ts`**: The root module that bundles all feature modules.
- **Feature Modules**:
  - **`auth`**: Handles user authentication.
    - **Current State**: Uses a hybrid approach.
      - **OTP Verification**: Logic is mocked (accepts any OTP) for development speed.
      - **Token Generation**: Generates **real JWTs** (`JwtService`) and persists users in PostgreSQL via Prisma.
  - **`transport`**: Manages ride-hailing logic. Key components include:
    - `TransportGateway`: A WebSocket Gateway (`/socket/rides`) for real-time communication.
    - `TransportService`:
      - Uses **PostGIS** for geospatial queries (finding nearby drivers).
      - Manages `TransportSession` state machine (requested -> accepted -> en_route -> completed).
      - Handles driver seeding into the `DriverLocation` table.
  - **`planner`**: Manages trip data persistence (`SavedTrip`).
    - Handles CRUD operations for trips.
    - Uses in-memory caching (`CacheModule`) for performance.
  - **`ai`**: The intelligence layer for the Trip Planner.
    - **`AIController`**: Handles complex search logic, ranking, and scoring of results.
    - **`AIService`**: Orchestrates RAG (Retrieval-Augmented Generation) flows.
    - **`EmbeddingService`**: Manages vector embeddings (`pgvector`) for context-aware search.
    - **Validation**: Enforces strict rules on generated itineraries (e.g., timing, sequence checks).
  - **`users`**: General user profile management.
  - **`marketplace`**: (Placeholder) For future local product/service listings.

## 2. Database Schema (Prisma + PostgreSQL)

We use **Prisma ORM** with a PostgreSQL database enabled with `PostGIS` and `pgvector` extensions.

### Core Models (`schema.prisma`)

- **`User`**: Identity store (`id`, `phone`, `name`, `email`, `preferences`, `updatedAt`).
- **`SavedTrip`**: Stores planned trips (`itinerary`, `preferences`, `startDate`, `endDate`).
- **`TransportSession`**: Manages active rides (`pickupLocation`, `destination`, `statusUpdates`, `fare`).
- **`DriverLocation`**: Stores real-time driver positions using PostGIS `geometry(Point, 4326)` for spatial queries.
- **`RideRequest`**: Stores initial ride request details.
- **`embeddings`**: Stores vector embeddings (`vector(1536)`) for the AI RAG system.
- **`PlannerMetadata`**: Key-value store for planner-specific configuration.
- **`SystemMetadata`**: global system settings.

## 3. Caching & Redis

**Current State**:

- **In-Memory Caching**: Used in `PlannerModule` (`cache-manager`) to cache trip details and history.
- **Redis**: ❌ Not yet integrated as a standalone service.

**Future Plan**: Redis will be introduced in later sprints for:

- **Queue Management**: Handling high-load tasks (e.g., matching algorithms) using BullMQ.
- **Pub/Sub**: Scaling WebSockets across multiple server instances (using Redis Adapter for Socket.io).
- **Distributed Caching**: Replacing in-memory cache for persistence.

## 4. Authentication Flow Details

- **`sendOtp(phoneNumber)`**:
  - Logs phone number to console (Mocked).
  - Returns success.

- **`verifyOtp(phoneNumber, otp)`**:
  - **Input**: Accepts _any_ OTP.
  - **Action**:
    1.  **Upserts User**: Creates or updates the user in the database based on `phoneNumber`.
    2.  **Generates Token**: Signs a **valid JWT** using `JwtService` with a configured secret.
  - **Output**: Returns the JWT `accessToken` and user details.
  - **Note**: This allows the frontend to use real authentication headers (`Authorization: Bearer <token>`) while bypassing SMS costs/complexity during dev.

## 5. AI & RAG Implementation

- **Vector Search**: Uses `pgvector` to find relevant activities based on user queries and preferences.
- **Ranking & Scoring**:
  - `AIController` implements a sophisticated scoring algorithm considering:
    - **Relevance**: Cosine similarity of embeddings.
    - **Preferences**: User interests match.
    - **Confidence**: Data quality and category matching.
- **Rich Explanations**: Generates "Why this place?" context, derived from ranking factors.
- **Validation Rules**: Ensures generated itineraries are logical (e.g., no generic phrases, correct time sequences).
