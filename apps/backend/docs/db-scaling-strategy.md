# Database Scaling & Indexing Strategy (Sprint 3 & Beyond)

## 1. Overview
As Roam Ceylon grows in user base and data volume (especially in Transport and AI Planning), our database indexing strategy must evolve to prevent latency spikes. This document outlines the optimizations for our current PostgreSQL (PostGIS + pgvector) setup.

## 2. Current Status
- **Spatial**: Using GIST indexes on `DriverLocation` and `RideRequest`.
- **Vector**: pgvector is enabled but currently performs exact match (brute force) vs ANN.
- **Relational**: Standard B-tree indexes on primary and foreign keys.

## 3. Immediate Optimization Needs (Sprint 3)

### A. Vector Search (AI Planner)
- **Problem**: Brute-force cosine similarity scans all rows. Slow at >10k entries.
- **Action**: Implement **HNSW** index on `embeddings.embedding`.
  - *SQL*: `CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);`
  - *Why*: HNSW offers high-speed recall with minimal performance degradation as the graph grows.

### B. Transport Status Queries
- **Problem**: The system frequently polls for `RideRequest` where `status = 'searching'`.
- **Action**: Add a **Partial B-tree Index** on `status`.
  - *SQL*: `CREATE INDEX ride_request_active_idx ON "RideRequest" (status) WHERE status IN ('searching', 'accepted');`
  - *Why*: This significantly reduces the index size and speeds up the most frequent "hot" queries.

### C. Full-Text Discovery
- **Problem**: Users search items by keywords (title/content) and vector.
- **Action**: Add **TSVECTOR** and **GIN** indexes for hybrid search.
  - *Why*: Enables efficient keyword search + vector ranking (Hybrid Search).

## 4. Scaling for High Volume

### A. Partitioning
- **Logs/Events**: If we add a `Telemetry` or `AuditLog` table, use **Table Partitioning** by `createdAt` (monthly/weekly).
- **Transport History**: Partition `RideRequest` by year/month to keep the active table lean.

### B. Connection Pooling
- **Action**: Enforce **PgBouncer** in production environments (like Nhost/Supabase).
- **Why**: NestJS microservices can quickly exhaust the 100-connection limit during traffic spikes.

### C. Spatial Clustering
- **Action**: Periodically run `CLUSTER "DriverLocation" USING driver_location_idx`.
- **Why**: Realigns the physical data on disk with the spatial index, speeding up range queries (nearby driver searches).

## 5. Summary of Recommended Indexes
| Table | Column | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `embeddings` | `embedding` | **HNSW** | Sub-ms vector search recall |
| `RideRequest` | `status` | **Partial B-tree** | Faster active ride lookups |
| `RideRequest` | `createdAt` | **B-tree** | History sorting & partitioning |
| `User` | `phone` | **B-tree (Unique)** | Fast auth lookups (Current) |
| `DriverLocation` | `location` | **GIST** | Nearest neighbor sorting (Current) |
