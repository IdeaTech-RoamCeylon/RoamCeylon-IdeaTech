# Sprint 2 Backend Development Plan

This document outlines the API specifications and technical requirements for Sprint 2, covering Real Authentication, Map & Transport features, and the AI Trip Planner.

## 1. Authentication Module (`/auth`)

**Goal:** Secure the application with robust JWT-based authentication, supporting role-based access (Passenger vs. Driver) and session management.

### New API Endpoints

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/refresh` | Refresh access token using a valid refresh token. | `{ refreshToken: string }` | `{ accessToken: string, refreshToken: string }` |
| `POST` | `/auth/logout` | Invalidate current session/tokens. | - | `{ message: "Logged out successfully" }` |
| `GET` | `/auth/profile` | Get currently logged-in user's details. | - | `{ user: UserProfileDto }` |
| `PATCH` | `/auth/profile` | Update user profile (name, email, preferences). | `UpdateProfileDto` | `{ user: UserProfileDto }` |

### Implementation Notes
- **Guards:** Implement `JwtAuthGuard` and `RolesGuard` (e.g., `@Roles('DRIVER')`).
- **Strategies:** Implement Passport strategies for `jwt` and `jwt-refresh`.
- **Database:** Ensure `User` model supports refresh token storage (hashed) or use a Redis store if planned (PostgreSQL is fine for now).

---

## 2. Transport & Map Module (`/transport`)

**Goal:** Enable ride booking, fare estimation, and real-time tracking using PostGIS for geospatial queries.

### New REST API Endpoints

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/transport/estimate` | Calculate fare and distance between two points. | `{ origin: LatLng, destination: LatLng, type: RideType }` | `{ price: number, distance: number, duration: number }` |
| `POST` | `/transport/book` | Create a new ride booking (initializes state). | `{ route: RouteDto, paymentMethod: string }` | `{ rideId: string, status: "PENDING" }` |
| `GET` | `/transport/drivers/nearby` | Find drivers within radius (PostGIS). | Query: `?lat=...&lng=...&radius=5000` | `[{ driverId: string, location: LatLng }]` |
| `GET` | `/transport/history` | Get user's past rides. | - | `[{ rideId: string, ... }]` |

### WebSocket Events (Socket.io)

**Namespace:** `/socket/rides`

**Client -> Server**
- `update_location`: Driver sends GPS updates.
  - Payload: `{ lat: number, lng: number, heading: number }`
- `join_ride_room`: Client joins room for specific ride updates.
  - Payload: `{ rideId: string }`

**Server -> Client**
- `driver_location_update`: Broadcast driver position to relevant passenger.
- `ride_status_change`: notification (e.g., `DRIVER_ARRIVED`, `STARTED`, `COMPLETED`).

### PostGIS Requirements
- Ensure `Driver` table has a `location` column of type `GEOMETRY(Point, 4326)`.
- Create spatial index on `location` for fast KNN (k-nearest neighbors) queries.

---

## 3. AI Trip Planner (`/ai`)

**Goal:** Generate personalized itineraries and provide RAG-based travel recommendations.

### New API Endpoints

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/ai/plan` | Generate a full multi-day itinerary. | `{ preferences: UserPreferences, dates: DateRange, budget: string }` | `{ itinerary: DayPlan[] }` |
| `POST` | `/ai/chat` | Conversational interface for refining plans. | `{ message: string, contextId: string }` | `{ reply: string, updatedPlan?: DayPlan[] }` |
| `GET` | `/ai/recommendations` | Get specific place suggestions based on user context. | Query: `?category=beach&lat=...` | `[{ place: PlaceDto, reason: string }]` |

### Implementation Notes
- **LLM Integration:** Use Gemini 1.5 Flash for fast generation.
- **RAG:** Continue using `pgvector` store seeded in previous tasks to retrieve context for the LLM.

---

## 4. ClickUp Backlog Tasks

Add these tasks to your sprint board:

**Authentication**
- [ ] Implement `JwtStrategy` and `RefreshTokenStrategy`.
- [ ] Create `/auth/refresh` and `/auth/logout` endpoints.
- [ ] Add `Roles` decorator and Guard for Role-Based Access Control (RBAC).

**Transport**
- [ ] Set up PostGIS extension in Prisma/DB.
- [ ] Implement `DriverService.findNearby` using raw SQL spatial queries.
- [ ] Create Fare Estimation logic (Time + Distance format).
- [ ] enhance Transport Gateway to handle location updates.

**AI Planner**
- [ ] Design Prompt Templates for Trip Generation.
- [ ] Connect `AiPlannerService` to Gemini API.
- [ ] Implement `POST /ai/plan` endpoint.
