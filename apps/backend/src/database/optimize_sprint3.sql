-- OPTIMIZED INDEXES FOR SPRINT 3 SCALING
-- Run this script directly against the PostgreSQL database

-- 1. Enable advanced vector index (HNSW) for high-speed AI Planner queries
-- This replaces the default brute-force search with an approximate nearest neighbor graph
-- Ops: vector_cosine_ops is standard for OpenAI embeddings
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- 2. Partial Index for Active Rides
-- Keeps the index small and fast by only tracking incomplete rides
-- Critical for the 'Driver Polling' loop
CREATE INDEX IF NOT EXISTS ride_request_active_idx ON "RideRequest" (status) 
WHERE status IN ('requested', 'accepted', 'en_route');

-- 3. Maintenance: Cluster Spatial Data
-- Physically reorder the table to match the spatial index
-- Drastically improves performance of ST_DWithin queries (Find Nearby Drivers)
CLUSTER "DriverLocation" USING driver_location_idx;
