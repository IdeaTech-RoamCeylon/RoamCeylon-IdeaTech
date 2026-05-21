# RoamCeylon Backend — Deployment Runbook

> **Day 67 — Final Phase (Production Ready)**  
> This document is the single source of truth for deploying and operating the RoamCeylon backend in production.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20.19.0 | LTS recommended |
| npm | ≥ 10 | Ships with Node 20 |
| Docker | ≥ 24 | For containerised deployments |
| Docker Compose | ≥ 2.20 | For local multi-service setup |
| PostgreSQL | ≥ 15 | With `postgis` and `vector` extensions |
| `pg_dump` / `pg_restore` | ≥ 15 | For backup & recovery scripts |

---

## Environment Variables Reference

Copy `apps/backend/.env.production.example` to `apps/backend/.env` on the production server and fill in all `CHANGE_ME` values.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string with `?sslmode=require` in production |
| `PORT` | ✅ | `3001` | Port the NestJS server listens on |
| `NODE_ENV` | ✅ | `development` | Set to `production` in production |
| `JWT_SECRET` | ✅ | — | 64-char random hex string — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | ❌ | `7d` | JWT token expiry (`1d` recommended for production) |
| `CORS_ORIGIN` | ✅ | `*` | Comma-separated allowed origins — **never use `*` in production** |
| `REDIS_URL` | ❌ | `redis://localhost:6379` | Redis connection string (future cache layer) |
| `LOG_LEVEL` | ❌ | `debug` | One of: `error`, `warn`, `info`, `debug`. Use `warn` in production. |
| `ML_ROLLOUT_PERCENTAGE` | ❌ | `50` | % of users receiving ML recommendations (0–100) |
| `CIRCUIT_BREAKER_THRESHOLD` | ❌ | `5` | Consecutive failures before ML circuit opens |
| `CIRCUIT_BREAKER_RESET_MS` | ❌ | `300000` | Time (ms) before circuit moves to HALF_OPEN (5 min) |
| `RECOMMENDATION_CACHE_TTL_MS` | ❌ | `300000` | Recommendation result cache TTL (5 min dev, 10 min prod) |
| `PROFILE_CACHE_TTL_MS` | ❌ | `600000` | User feature profile cache TTL (10 min dev, 30 min prod) |
| `GOOGLE_CLIENT_ID` | ❌ | — | Google OAuth client ID (if Google login is enabled) |
| `GOOGLE_CLIENT_SECRET` | ❌ | — | Google OAuth client secret |

---

## Deployment Procedure

### Option A: Docker (Recommended for Production)

```bash
# 1. Clone / pull latest code
git pull origin main

# 2. Build the production image
docker build \
  -f apps/backend/Dockerfile.prod \
  -t roamceylon-backend:latest \
  ./apps/backend

# 3. Run the production stack
docker compose --profile production up -d

# 4. Verify the container is healthy
docker compose ps
docker logs roamceylon-backend --tail 50
```

### Option B: Direct (Node on a VPS / Railway / Render)

```bash
# 1. Install dependencies
npm ci --workspace=apps/backend

# 2. Run database migrations (safe — applies pending only, no destructive changes)
npx tsx apps/backend/scripts/db-setup.ts

# 3. Build the TypeScript bundle
npm run build --workspace=apps/backend

# 4. Start the production server
NODE_ENV=production node apps/backend/dist/main
```

---

## Database Migration Procedure

Run on **every deploy** before starting the new server:

```bash
cd apps/backend
npx prisma migrate deploy
```

- ✅ Safe — only applies pending migrations, never resets data
- ✅ Idempotent — safe to run multiple times
- ❌ Never use `prisma migrate dev` or `prisma migrate reset` in production

For a full setup + verification:

```bash
npx tsx scripts/db-setup.ts
# With seed data (first deploy only):
npx tsx scripts/db-setup.ts --seed
```

---

## API Stability Check

Before promoting a deployment to production traffic, run the API stability verification:

```bash
# Against local dev server
npx tsx scripts/api-stability-check.ts

# Against a specific environment
npx tsx scripts/api-stability-check.ts --url=https://staging.your-app.com
```

The script checks all 9 critical endpoints and exits 0 (pass) or 1 (fail).  
Add this as a CI/CD step before deploying to production.

---

## Monitoring Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Liveness check — used by load balancers and Docker HEALTHCHECK | `{ status: 'ok', uptime, timestamp }` |
| `GET /api/ml/health` | Deep health — ML circuit breakers, cache, queue, system metrics | `{ status: 'healthy' \| 'degraded' \| 'critical', issues[], ... }` |
| `GET /api/ml/cache/stats` | Recommendation cache hit rate and sizes | `{ recommendationCache, profileCache, totalEntries }` |
| `GET /api/ml/queue/stats` | Background task queue counters | `{ pending, active, completed, failed }` |
| `GET /api/ml/db/stats` | Database table sizes and slowest endpoints | `{ tableStats[], slowestEndpoints[] }` |

**Recommended polling interval**: every 30 seconds from your monitoring tool (Datadog, UptimeRobot, etc.).

---

## Fail-Safe Reference

The system is designed to **never break**. If any component fails, automatic fallbacks kick in:

| Component | Failure Mode | Fallback |
|-----------|-------------|---------|
| ML Prediction | Throws an error | Rule-based recommendations (immediate) |
| ML Circuit Breaker OPEN | 5+ consecutive ML failures | All requests use rule-based for 5 minutes |
| Recommendation Cache | OOM or any exception | Falls through to fresh DB + model call |
| Background Queue full | > 500 tasks queued | Feature refresh runs synchronously (blocking but safe) |
| DB connection | Transient error | 3-attempt retry with exponential backoff |

**Circuit Breaker States:**

```
CLOSED ──(5 failures)──► OPEN ──(5 min)──► HALF_OPEN ──(success)──► CLOSED
                                                        └──(failure)──► OPEN
```

Check current state: `GET /api/ml/health` → `circuitBreakers` field.

---

## Backup Schedule

| Type | Frequency | Retention | Script |
|------|-----------|-----------|--------|
| Full DB backup | Daily at 02:00 UTC | 7 days | `scripts/db-backup.sh` |
| Weekly snapshot | Every Sunday at 01:00 UTC | 4 weeks | `scripts/db-backup.sh` with `RETAIN_DAYS=28` |

**Add to crontab on the production server:**

```cron
# Daily backup at 02:00 UTC
0 2 * * * cd /path/to/RoamCeylon-IdeaTech/apps/backend && bash scripts/db-backup.sh >> /var/log/db-backup.log 2>&1

# Weekly long-retention backup
0 1 * * 0 cd /path/to/RoamCeylon-IdeaTech/apps/backend && RETAIN_DAYS=28 BACKUP_DIR=/mnt/weekly-backups bash scripts/db-backup.sh >> /var/log/db-backup-weekly.log 2>&1
```

---

## Recovery Procedure

### Full Database Restore

> ⚠️ **This is destructive — all current data will be replaced by the backup.**

```bash
# 1. List available backups
ls -lh apps/backend/backups/

# 2. Stop the application (prevent writes during restore)
docker compose stop backend
# or: systemctl stop roamceylon-backend

# 3. Run the restore script
bash apps/backend/scripts/db-restore.sh apps/backend/backups/backup_2026-05-20_02-00-00.dump

# 4. Verify the restore (the script prints row counts per table)

# 5. Start the application
docker compose start backend
# or: systemctl start roamceylon-backend

# 6. Run the stability check
npx tsx apps/backend/scripts/api-stability-check.ts
```

### Application Rollback (Code)

```bash
# 1. Identify the last stable Docker image tag or Git commit
git log --oneline -10

# 2. Roll back to the previous commit
git checkout <previous-commit-hash>

# 3. Rebuild and restart
docker build -f apps/backend/Dockerfile.prod -t roamceylon-backend:rollback ./apps/backend
docker compose --profile production up -d --no-deps backend-prod

# 4. Verify stability
npx tsx apps/backend/scripts/api-stability-check.ts
```

---

## Build Verification Checklist

Before any production deployment, confirm:

```bash
# ✅ TypeScript compiles without errors
npm run build --workspace=apps/backend

# ✅ No lint errors
npm run lint --workspace=apps/backend

# ✅ All unit tests pass
npm run test --workspace=apps/backend -- modules/ml

# ✅ API stability check passes (requires running server)
npx tsx apps/backend/scripts/api-stability-check.ts
```
