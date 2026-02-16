# Database Schema Freeze — Month 2 Lock
**Freeze Date**: 2026-02-13  
**Schema Version**: Month 2 Final  
**Git Tag**: `v2-schema-freeze`  
**Status**: ❄️ FROZEN

## Overview

This document represents the **final frozen state** of the database schema for Month 2. Any modifications to the schema listed below require explicit Month 3 approval and must follow the change process outlined in the Freeze Protocols section.

**Purpose**: Prevent accidental regressions and ensure Month 3 frontend/mobile/AI integrations have a stable database contract.

---

## Frozen Schema Snapshot

### Extensions

```prisma
extensions = [citext(schema: "public"), postgis, vector]
```

**Enabled PostgreSQL Extensions**:
- `citext`: Case-insensitive text type
- `postgis`: Geospatial query support (ST_* functions, geometry types)
- `vector`: pgvector for AI embeddings (similarity search)

---

## Models

### User
**Purpose**: Core identity and profile store

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | @id, @default(uuid()) | Primary key |
| `phoneNumber` | String | @unique, @map("phone") | Authentication identifier |
| `name` | String? | Optional | Display name |
| `email` | String? | Optional | Contact email |
| `birthday` | DateTime? | Optional | Date of birth |
| `gender` | String? | Optional | Gender identity |
| `preferences` | Json? | Optional | User preference object |
| `createdAt` | DateTime | @default(now()) | Account creation |
| `updatedAt` | DateTime | @default(now()), @updatedAt | Last modification |

**Indexes**: None (phoneNumber is unique, automatically indexed)

---

### SavedTrip
**Purpose**: Stores user trip plans and itineraries

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Int | @id, @default(autoincrement()) | Primary key |
| `userId` | String | Required | Foreign key to User |
| `name` | String | Required | Trip name |
| `destination` | String | Required | Destination location |
| `startDate` | DateTime | Required | Trip start date |
| `endDate` | DateTime | Required | Trip end date |
| `itinerary` | Json | Required | Day-by-day itinerary |
| `preferences` | Json? | Optional | Trip-specific preferences |
| `createdAt` | DateTime | @default(now()) | Trip creation |
| `updatedAt` | DateTime | @updatedAt | Last modification |

**Indexes**:
- `@@index([userId, createdAt])` — Optimize user trip history queries

---

### TransportSession
**Purpose**: Manages active and historical ride sessions

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | @id, @default(uuid()) | Primary key |
| `passengerId` | String | Required | Passenger user ID |
| `driverId` | String? | Optional | Assigned driver ID |
| `status` | String | Required | Ride status (state machine) |
| `pickupLocation` | Json | Required | Pickup coordinates |
| `destination` | Json | Required | Destination coordinates |
| `fare` | Decimal? | Optional | Calculated fare |
| `startTime` | DateTime | @default(now()) | Ride request time |
| `endTime` | DateTime? | Optional | Ride completion time |
| `statusUpdates` | Json[] | @default([]) | Audit trail array |

**Indexes**:
- `@@index([passengerId])` — User ride history
- `@@index([driverId])` — Driver assignment queries
- `@@index([status])` — Active ride filtering

**Status Values**: `requested`, `accepted`, `en_route`, `completed`, `cancelled`

---

### DriverLocation
**Purpose**: Real-time geospatial driver locations (PostGIS)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Int | @id, @default(autoincrement()) | Primary key |
| `driverId` | String | Required | Driver user ID |
| `location` | Unsupported("geometry") | Required | PostGIS Point(lng, lat) |
| `updatedAt` | DateTime | Required | Last location update |

**Indexes**:
- `@@index([location], name: "driver_location_idx", type: Gist)` — Spatial queries
- `@@index([driverId], name: "driver_id_idx")` — Driver lookup

**SRID**: 4326 (WGS 84 - GPS coordinates)

---

### RideRequest
**Purpose**: Initial ride request before session creation

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Int | @id, @default(autoincrement()) | Primary key |
| `passengerId` | String | Required | Passenger user ID |
| `pickupLocation` | Unsupported("geometry") | Required | PostGIS Point |
| `destination` | Unsupported("geometry") | Required | PostGIS Point |
| `status` | String | Required | Request status |
| `createdAt` | DateTime | @default(now()) | Request timestamp |

**Indexes**:
- `@@index([pickupLocation], name: "ride_request_pickup_idx", type: Gist)` — Spatial
- `@@index([destination], name: "ride_request_dest_idx", type: Gist)` — Spatial
- `@@index([passengerId], name: "ride_request_passenger_idx")` — User lookup
- `@@index([status], name: "ride_request_status_idx")` — Status filtering

---

### embeddings
**Purpose**: Vector embeddings for AI RAG system (pgvector)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Int | @id, @default(autoincrement()) | Primary key |
| `embedding` | Unsupported("vector")? | Optional | 1536-dim vector |
| `created_at` | DateTime | @default(now()) | Creation timestamp |
| `content` | String? | Optional | Original text content |
| `title` | String? | Optional | Embedding title/label |

**Indexes**:
- `@@index([title], name: "embeddings_title_idx")` — Text search
- HNSW index on `embedding` (created via migration, not in Prisma schema)

---

### PlannerMetadata
**Purpose**: Key-value store for planner configuration

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Int | @id, @default(autoincrement()) | Primary key |
| `key` | String | @unique | Config key |
| `value` | Json | Required | Config value object |
| `updatedAt` | DateTime | @updatedAt | Last modification |

---

### SystemMetadata
**Purpose**: Global system settings

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `key` | String | @id | Primary key |
| `value` | String | Required | Setting value |
| `updatedAt` | DateTime | Required | Last modification |

---

### spatial_ref_sys
**Purpose**: PostGIS spatial reference system catalog (auto-generated)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `srid` | Int | @id | Spatial reference ID |
| `auth_name` | String? | VarChar(256) | Authority name |
| `auth_srid` | Int? | Optional | Authority SRID |
| `srtext` | String? | VarChar(2048) | WKT definition |
| `proj4text` | String? | VarChar(2048) | Proj4 definition |

**Note**: Contains check constraints. Managed by PostGIS, not application code.

---

## Freeze Protocols

### 1. No Breaking Changes

**Prohibited Actions**:
- ❌ Removing models or fields
- ❌ Renaming models or fields
- ❌ Changing field types (e.g., String → Int)
- ❌ Removing indexes
- ❌ Changing constraints (required → optional is allowed)

### 2. Migration Guard Script

A validation script [`scripts/check-schema-freeze.ts`](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/scripts/check-schema-freeze.ts) runs in CI/CD to detect:
- Model/field deletions or renames
- Type changes
- Index removals

**Usage**:
```bash
npx ts-node scripts/check-schema-freeze.ts
```

**Exit Codes**:
- `0`: Schema unchanged or only approved changes
- `1`: Breaking change detected (blocks deployment)

### 3. Git Tag Reference

The exact schema state is tagged in Git:
```bash
git tag v2-schema-freeze
git push origin v2-schema-freeze
```

To compare current schema:
```bash
git diff v2-schema-freeze -- prisma/schema.prisma
```

### 4. Allowed Additions (Month 3)

**Permitted with approval**:
- ✅ Adding new models
- ✅ Adding new optional fields to existing models
- ✅ Adding new indexes
- ✅ Adding new extensions

**Process**:
1. Document change in Month 3 sprint plan
2. Update this freeze document
3. Create migration
4. Update Git tag to `v3-schema-freeze`

---

## Schema Statistics

- **Total Models**: 10 (excluding `spatial_ref_sys`)
- **Geospatial Models**: 2 (`DriverLocation`, `RideRequest`)
- **Vector Models**: 1 (`embeddings`)
- **User-Facing Models**: 4 (`User`, `SavedTrip`, `TransportSession`, `DriverLocation`)
- **Total Indexes**: 14 (including 4 GIST spatial indexes)

---

## Verification

To verify schema integrity:

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Check Migration Status**:
   ```bash
   npx prisma migrate status
   ```

3. **Validate Against Frozen Snapshot**:
   ```bash
   npx ts-node scripts/check-schema-freeze.ts
   ```

---

## Related Documentation

- [API Freeze Snapshot](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/API_FREEZE_SNAPSHOT.md) — Frozen API contracts
- [Backend Architecture](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/BACKEND_ARCHITECTURE.md) — Schema usage patterns
- [Month 2 Roadmap](file:///Users/sayurathejan/IdeaProjects/RoamCeylon-IdeaTech-1/apps/backend/MONTH_2_ROADMAP.md) — Strategic context

---

**Last Updated**: 2026-02-13  
**Maintained By**: Backend Team  
**Review Cycle**: Start of each Month
