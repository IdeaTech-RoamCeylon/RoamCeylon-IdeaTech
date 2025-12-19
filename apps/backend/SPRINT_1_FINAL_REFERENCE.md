# Sprint 1 Final Reference: Backend Documentation
**Status**: LOCKED 🔒
**Date**: 2025-12-18
**Version**: 1.0 (End of Sprint 1)

This document serves as the **definitive structure and baseline** for the RoamCeylon backend as of the end of Sprint 1. All development in Sprint 2 will build upon this foundation.

---

## 1. Database Schema (PostgreSQL + PostGIS + pgvector)

We use Prisma as our ORM. The database requires the `postgis` and `vector` extensions.

### Extensions
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

### Models

#### `User`
Minimal identity storage.
```prisma
model User {
  id        String   @id @default(uuid())
  phone     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

#### `embeddings` (AI System)
Stores text embeddings for the AI Trip Planner's RAG system.
```prisma
model embeddings {
  id         Int                    @id @default(autoincrement())
  text       String
  embedding  Unsupported("vector(1536)")?
  created_at DateTime               @default(now())
}
```

#### `DriverLocation` (Transport)
Real-time geospatial storage for drivers.
```prisma
model DriverLocation {
  id        Int      @id @default(autoincrement())
  driverId  String
  location  Unsupported("geometry(Point, 4326)")
  updatedAt DateTime @updatedAt
}
```

#### `RideRequest` (Transport)
Stores active request geospatial data.
```prisma
model RideRequest {
  id             Int      @id @default(autoincrement())
  passengerId    String
  pickupLocation Unsupported("geometry(Point, 4326)")
  destination    Unsupported("geometry(Point, 4326)")
  status         String
  createdAt      DateTime @default(now())
}
```

#### `SystemMetadata`
```prisma
model SystemMetadata {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

---

## 2. API Reference (Current Implementation)

### Authentication Module (`/auth`)
*Current State: Mock Implementation*

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/send-otp` | Logs OTP to console. Returns success message. | ✅ Mocked |
| `POST` | `/auth/verify-otp` | Accepts ANY OTP. Returns mock JWT & User. | ✅ Mocked |

### AI Planner Module (`/ai`)

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/ai/health` | Returns "AI Planner Module Operational". | ✅ Live |
| `POST` | `/ai/seed` | Seeds database with initial travel data embeddings. | ✅ Live |

### Transport Module (`/transport`)
*Rest logic is currently minimal; primary interaction is via WebSockets.*

#### REST Endpoints
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/transport` | (Empty controller root) | 🚧 Pending |

#### WebSocket Events (`Namespace: /socket/rides`)
| Direction | Event Name | Payload | Status |
| :--- | :--- | :--- | :--- |
| **Client -> Server** | `passenger_request` | `{ origin: string, destination: string }` | ✅ Logging Only |
| **Client -> Server** | `driver_accept` | `{ rideId: string, driverId: string }` | ✅ Logging Only |
| **Client -> Server** | `ride_cancel` | `{ rideId: string, reason: string }` | ✅ Logging Only |

---

## 3. Migration & Setup Steps

To initialize this backend state from a fresh clone:

1.  **Environment Setup**:
    Ensure `.env` contains:
    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/roamceylon_db"
    ```

2.  **Start Database**:
    Ensure PostgreSQL is running with PostGIS enabled. If using Docker:
    ```bash
    docker run --name roam-db -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgis/postgis
    ```

3.  **Run Migrations**:
    Apply the Prisma schema to the database.
    ```bash
    npx prisma migrate dev
    ```

4.  **Seed Data (Optional)**:
    Populate initial AI embeddings.
    ```bash
    npx ts-node prisma/seed.ts
    ```
    *Alternatively, hit the `POST /ai/seed` endpoint after starting the server.*

5.  **Start Server**:
    ```bash
    npm run start:dev
    ```

---

## Validation Checklist (Sprint 1)
- [x] NestJS Application initializes without errors.
- [x] Database connects and Schema is synced.
- [x] `/auth/verify-otp` returns a token (albeit mock).
- [x] WebSocket `/socket/rides` accepts connections.
- [x] AI Embedding seeding script runs successfully.

**This document represents the finalized state of Sprint 1. No further changes to Sprint 1 scope are permitted.**
