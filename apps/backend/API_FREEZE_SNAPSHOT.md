# API Freeze Snapshot
**Status:** ❄️ FROZEN
**Date:** 2026-01-20
**Version:** Sprint 3 Final

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

## 5. Transport (`/transport`) [Guarded]
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

## 6. Users (`/users`) [Guarded]
### Get Current User
- **Endpoint:** `GET /users/me`
- **Response:** User profile object.

---

## ❄️ Freeze Protocols
1. **No New Endpoints**: Do not add any new controllers or route handlers.
2. **Schema Locking**: Do not rename, remove, or change the type of any existing DTO fields.
3. **Hotfixes Only**: Changes allowed ONLY if a Critical Severity bug is found (e.g. app crash, security flaw).
4. **Docs First**: If a hotfix is required, update this document FIRST before merging code.
