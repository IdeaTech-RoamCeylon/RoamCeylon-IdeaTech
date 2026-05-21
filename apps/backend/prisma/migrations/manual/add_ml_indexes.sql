-- apps/backend/prisma/migrations/manual/add_ml_indexes.sql
--
-- High-impact indexes for ML module tables.
-- Run once on the production database AFTER `prisma migrate deploy`.
--
-- ⚠️  All indexes use CONCURRENTLY so they don't lock the table during creation.
--     Run this while the server is live — no downtime required.
--
-- Usage:
--   psql "$DATABASE_URL" -f prisma/migrations/manual/add_ml_indexes.sql

-- ─── recommendation_logs ─────────────────────────────────────────────────────
-- Supports: "give me recommendations for user X sorted by most recent"
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rec_log_user_created
  ON recommendation_logs (user_id, created_at DESC);

-- ─── user_behavior_events ─────────────────────────────────────────────────────
-- Supports: "give me all click events for user X"
-- Used by FeatureExtractionService.generateUserFeatures()
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_behavior_user_type
  ON user_behavior_events (user_id, event_type);

-- ─── PlannerEvent ─────────────────────────────────────────────────────────────
-- Supports: "give me all latency_sample events in the last 24h sorted by time"
-- Used by DbOptimizationService.getSlowestEndpoints()
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planner_event_type_ts
  ON "PlannerEvent" (event_type, timestamp DESC);

-- ─── PendingFeedbackLearning ──────────────────────────────────────────────────
-- Partial index on only FUTURE rows — much smaller and faster for queue processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_feedback_process_after
  ON "PendingFeedbackLearning" (process_after)
  WHERE process_after > NOW();

-- ─── user_interest_profile ────────────────────────────────────────────────────
-- Supports: lookups by userId (already PK, but explicit for clarity)
-- The PK index already covers this — no new index needed.

-- ─── destination_category_scores ─────────────────────────────────────────────
-- Supports: "give me scores for destinations in this list" (IN query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dest_score_destination_id
  ON destination_category_scores (destination_id);

-- ─── Verify ───────────────────────────────────────────────────────────────────
-- After running, verify all indexes were created:
--
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
