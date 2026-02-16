# API Freeze Snapshot
**Status:** ❄️ FROZEN
**Date:** 2026-02-13
**Version:** Month 2 Final

## Overview
This document represents the **final frozen state** of the backend API contracts.
Any changes to the endpoints, request schemas, or response structures listed below are **strictly prohibited** without an Emergency Hotfix approval.

This freeze is enforced to ensure stability for frontend (mobile/web) and AI integrations.

---

## 1. System Health
### Get System Health
- **Endpoint:** `GET /health`
- **Description:** Checks basic API reachability.
- **Response:** `{ "status": "ok" }`

---

## 2. AI Module (`/ai`)
### Get AI Status
- **Endpoint:** `GET /ai/health`
- **Description:** Returns AI algorithm version and lock status.

### Keyword Search
- **Endpoint:** `GET /ai/search`
- **Query Params:** `query` (string)
- **Response:** `SearchResponseDto` (List of ranked items with metadata)

### Vector Search
- **Endpoint:** `GET /ai/search/vector`
- **Query Params:** 
  - `q` (string, required)
  - `limit` (number, optional)
  - `minConfidence` ('High' | 'Medium' | 'Low', optional)
- **Response:** `SearchResponseDto`

### Generate Basic Trip Plan
- **Endpoint:** `POST /ai/trip-plan`
- **Body:** `TripPlanRequestDto`
  ```json
  {
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "preferences": ["string"]
  }
  ```
- **Response:** `TripPlanResponseDto` (Day-by-day itinerary)

### Generate Advanced Trip Plan (Sprint 3)
- **Endpoint:** `POST /ai/trip-plan/advanced`
- **Body:** `AdvancedTripPlanRequestDto`
  ```json
  {
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "preferences": ["string"],
    "budget": "Budget" | "Standard" | "Luxury",
    "pace": "Relaxed" | "Moderate" | "Fast",
    "accommodationType": "string",
    "travelers": number
  }
  ```
- **Response:** `TripPlanResponseDto`

### Debug & Utilities
- **Endpoint:** `POST /ai/seed` (Re-seeds embeddings)
- **Endpoint:** `GET /ai/debug/embedding` (Inspects vector generation)

---

## 3. Auth Module (`/auth`)
### Send OTP
- **Endpoint:** `POST /auth/send-otp`
- **Body:** `{ "phoneNumber": "string" }`

### Verify OTP
- **Endpoint:** `POST /auth/verify-otp`
- **Body:** `{ "phoneNumber": "string", "otp": "string" }`
- **Response:** `{ "accessToken": "string", "user": { ... } }`

---

## 4. Marketplace (`/marketplace`)
### Get Categories
- **Endpoint:** `GET /marketplace/categories`

### Get Products
- **Endpoint:** `GET /marketplace/products`
- **Query Params:** `category`, `sortBy`

### Get Product Details
- **Endpoint:** `GET /marketplace/products/:id`

---

## 5. Planner (`/planner`) [Guarded]
### Save Trip
- **Endpoint:** `POST /planner/trips`
- **Body:** `CreateTripDto`
  ```json
  {
    "name": "string" (optional, max 100 chars),
    "destination": "string" (optional, max 100 chars),
    "startDate": "YYYY-MM-DD" (required, ISO 8601),
    "endDate": "YYYY-MM-DD" (required, ISO 8601, must be after startDate),
    "itinerary": { ... } (required, object),
    "preferences": {
      "budget": "low" | "medium" | "high" (optional),
      "interests": ["string"] (optional, max 20 items, max 50 chars each),
      "travelStyle": "relaxed" | "moderate" | "packed" (optional),
      "accessibility": boolean (optional)
    }
  }
  ```
- **Response:** Saved trip object with ID

### Get Trip
- **Endpoint:** `GET /planner/trips/:id`
- **Response:** Trip details (only if user owns trip)

### Get Trip History
- **Endpoint:** `GET /planner/trips`
- **Response:** Array of user's saved trips, ordered by creation date (desc)

### Update Trip
- **Endpoint:** `PATCH /planner/trips/:id`
- **Body:** `UpdateTripDto` (all fields optional)
  ```json
  {
    "name": "string",
    "destination": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "itinerary": { ... },
    "preferences": { ... }
  }
  ```
- **Response:** Updated trip object

### Delete Trip
- **Endpoint:** `DELETE /planner/trips/:id`
- **Response:** Deleted trip object

**Validation Rules**:
- Maximum 20 interests per trip
- Start date must be before end date
- Access control enforced (user can only modify own trips)
- Preferences normalized with safe defaults

**Caching**: 5-minute TTL on trip reads

---

## 6. Transport (`/transport`) [Guarded]
### Get Nearby Drivers
- **Endpoint:** `GET /transport/drivers`
- **Query Params:** `lat` (number), `lng` (number), `limit` (number)
- **Response:** List of drivers with coordinates.

### Create Ride Request
- **Endpoint:** `POST /transport/ride`
- **Body:** `{ "passengerId": "string", "pickup": { "lat": number, "lng": number }, "destination": { "lat": number, "lng": number } }`

### Update Ride Status
- **Endpoint:** `POST /transport/ride/status`
- **Body:** `{ "rideId": number, "status": "string" }`

### Get Ride Status (Sprint 3)
- **Endpoint:** `GET /transport/ride-status`
- **Query Params:** `rideId` (string)
- **Response:** `{ "data": { ...rideDetails }, "meta": { ... } }`

### Simulation & Seeding
- **Endpoint:** `POST /transport/seed`
- **Endpoint:** `GET /transport/simulate`

---

## 7. Users (`/users`) [Guarded]
### Get Current User
- **Endpoint:** `GET /users/me`
- **Response:** User profile object.

### Update User
- **Endpoint:** `PATCH /users/me`
- **Body:** `UpdateUserDto`
  ```json
  {
    "name": "string" (optional),
    "email": "string" (optional, valid email),
    "birthday": "YYYY-MM-DD" (optional),
    "gender": "string" (optional),
    "preferences": { ... } (optional)
  }
  ```
- **Response:** Updated user profile object.

---

## ❄️ Freeze Protocols
1. **No New Endpoints**: Do not add any new controllers or route handlers.
2. **Schema Locking**: Do not rename, remove, or change the type of any existing DTO fields.
3. **Hotfixes Only**: Changes allowed ONLY if a Critical Severity bug is found (e.g. app crash, security flaw).
4. **Docs First**: If a hotfix is required, update this document FIRST before merging code.
