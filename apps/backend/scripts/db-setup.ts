#!/usr/bin/env tsx
// apps/backend/scripts/db-setup.ts
//
// Production database setup script — safe to run on every deploy.
//
// What it does:
//   1. Verifies DATABASE_URL is set and the DB is reachable
//   2. Runs `prisma migrate deploy` (non-destructive — applies pending migrations only)
//   3. Verifies all expected tables exist post-migration
//   4. Exits 0 on success, 1 on any failure (CI/CD compatible)
//
// Usage:
//   npx tsx scripts/db-setup.ts
//   npx tsx scripts/db-setup.ts --seed    (also seeds initial data)

import { execSync } from 'child_process';
import { Client } from 'pg';

// ─── Config ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const SEED = args.includes('--seed');

// Tables that must exist after migration
const REQUIRED_TABLES = [
  'User',
  'UserBehaviorEvent',
  'UserInterestProfile',
  'RecommendationLog',
  'PlannerFeedback',
  'DestinationCategoryScore',
  'SystemMetric',
  'PlannerEvent',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[db-setup] ${msg}`);
}

function fail(msg: string): never {
  console.error(`[db-setup] ❌ FATAL: ${msg}`);
  process.exit(1);
}

// ─── Step 1: Verify env ───────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  fail('DATABASE_URL is not set. Copy .env.example to .env and fill in the value.');
}

log(`✅ DATABASE_URL is set`);
log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);

// ─── Step 2: Check DB connectivity ───────────────────────────────────────────

log('Connecting to database...');

const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  const { rows } = await client.query('SELECT version()');
  log(`✅ Connected to PostgreSQL: ${(rows[0] as { version: string }).version}`);
} catch (err) {
  fail(`Cannot connect to database: ${(err as Error).message}`);
}

// ─── Step 3: Run Prisma migrations ────────────────────────────────────────────

log('Running prisma migrate deploy...');

try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
  log('✅ Migrations applied successfully');
} catch (err) {
  fail(`prisma migrate deploy failed: ${(err as Error).message}`);
}

// ─── Step 4: Verify tables exist ─────────────────────────────────────────────

log('Verifying required tables...');

const { rows: tableRows } = await client.query<{ tablename: string }>(`
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
`);

const existingTables = new Set(tableRows.map((r) => r.tablename));
const missingTables = REQUIRED_TABLES.filter((t) => !existingTables.has(t));

if (missingTables.length > 0) {
  fail(`Missing tables after migration: ${missingTables.join(', ')}`);
}

log(`✅ All ${REQUIRED_TABLES.length} required tables verified`);

// ─── Step 5: Optional seed ───────────────────────────────────────────────────

if (SEED) {
  log('--seed flag detected. Running seed script...');
  try {
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: process.env });
    log('✅ Seed completed');
  } catch (err) {
    // Non-fatal — seed may have already run
    console.warn(`[db-setup] ⚠️  Seed failed (may already exist): ${(err as Error).message}`);
  }
}

// ─── Done ─────────────────────────────────────────────────────────────────────

await client.end();
log('✅ Database setup complete — ready for production');
process.exit(0);
