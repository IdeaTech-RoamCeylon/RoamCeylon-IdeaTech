# RoamCeylon Backend Documentation

## Overview
This documentation outlines the backend architecture, API endpoints, database schema, and specialized features (PostGIS & pgvector) for the RoamCeylon application. It is intended to guide the development and scaling of the backend services.

## API Endpoints

### Authentication (`/auth`)
*   **POST** `/auth/send-otp`
    *   **Description**: Sends an OTP to the provided phone number.
    *   **Request Body**:
        ```json
        {
          "phoneNumber": "string"
        }
        ```
    *   **Response**:
        ```json
        {
          "message": "string"
        }
        ```

*   **POST** `/auth/verify-otp`
    *   **Description**: Verifies the OTP and returns an access token.
    *   **Request Body**:
        ```json
        {
          "phoneNumber": "string",
          "otp": "string"
        }
        ```
    *   **Response**:
        ```json
        {
          "accessToken": "string",
          "user": {
            "id": "string",
            "phoneNumber": "string"
          }
        }
        ```

### Users (`/users`)
*   **GET** `/users/me`
    *   **Description**: Retrieves the profile of the currently authenticated user.
    *   **Response**: User object (structure depends on `UsersService`).

### Marketplace (`/marketplace`)
*   **GET** `/marketplace/categories`
    *   **Description**: Fetches available product categories.
    *   **Response**:
        ```json
        [
          { "id": "1", "name": "Electronics" },
          { "id": "2", "name": "Souvenirs" }
        ]
        ```

*   **GET** `/marketplace/products`
    *   **Query Params**: `?category=string` (optional)
    *   **Description**: Fetches products, optionally filtered by category.
    *   **Response**: List of products.

*   **GET** `/marketplace/products/:id`
    *   **Description**: Fetches details for a specific product.

### AI & Planner (`/ai`)
*   **GET** `/ai/health`
    *   **Description**: Checks the health of the AI module.
*   **POST** `/ai/embeddings/seed`
    *   **Description**: Seeds the vector database with initial embeddings.
*   **POST** `/ai/seed`
    *   **Description**: Seeds the database from the AI planner service.

> **Note**: Both `AIController` and `AiPlannerController` currently map to the `/ai` route. Ensure no conflicting paths exist in future iterations.

---

## WebSocket Events (Transport)

**Namespace**: `/socket/rides`

### Events

1.  **Passenger Request**
    *   **Event Name**: `passenger_request`
    *   **Payload**:
        ```json
        {
          "origin": "string",
          "destination": "string",
          "timestamp": "ISO8601 string"
        }
        ```
    *   **Acknowledgment**: `passenger_request_ack`

2.  **Driver Accept**
    *   **Event Name**: `driver_accept`
    *   **Payload**:
        ```json
        {
          "rideId": "string",
          "driverId": "string"
        }
        ```
    *   **Acknowledgment**: `driver_accept_ack`

3.  **Ride Cancel**
    *   **Event Name**: `ride_cancel`
    *   **Payload**:
        ```json
        {
          "rideId": "string",
          "reason": "string"
        }
        ```
    *   **Acknowledgment**: `ride_cancel_ack`

---

## Database Schema (Prisma)

The database, powered by PostgreSQL, utilizes the following key models:

*   **User**
    *   `id`: String (UUID)
    *   `phone`: String (Unique)
    *   `name`: String (Optional)
    *   `createdAt`: DateTime

*   **embeddings** (for AI/Vector Search)
    *   `id`: Int
    *   `text`: String
    *   `embedding`: Unsupported("vector(1536)")
    *   `created_at`: DateTime

*   **DriverLocation** (Geo-Spatial)
    *   `id`: Int
    *   `driverId`: String
    *   `location`: Unsupported("geometry(Point, 4326)")
    *   `updatedAt`: DateTime

*   **RideRequest** (Geo-Spatial)
    *   `id`: Int
    *   `passengerId`: String
    *   `pickupLocation`: Unsupported("geometry(Point, 4326)")
    *   `destination`: Unsupported("geometry(Point, 4326)")
    *   `status`: String
    *   `createdAt`: DateTime

---

## PostGIS & pgvector

### Configuration
The project uses Prisma with PostgreSQL extensions enabled for advanced geo-spatial and vector capabilities.

*   **PostGIS**: Enabled via the `postgis` extension. Used for storing and querying geographical data (points, locations) in `DriverLocation` and `RideRequest` models using SRID 4326 (WGS 84).
*   **pgvector**: Enabled via the `vector` extension. Used in the `embeddings` model to store 1536-dimensional vectors (compatible with OpenAI embeddings) for semantic search and AI features.

### Usage Notes
*   Ensure the database user has superuser privileges or specific grants to `CREATE EXTENSION`.
*   Raw SQL or specialized Prisma queries might be needed for complex spatial interactions (e.g., "find drivers within radius").
