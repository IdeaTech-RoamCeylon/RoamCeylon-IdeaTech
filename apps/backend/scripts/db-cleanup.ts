#!/usr/bin/env tsx
// apps/backend/scripts/db-cleanup.ts
//
// Database Final Cleanup Script — Day 68 Task 2
//
// Identifies and removes stale/unused data safely.
// DRY-RUN by default — pass --apply to actually delete rows.
//
// What it cleans:
//   1. Stale PlannerEvent latency_sample rows  (> 30 days old)
//   2. Stale SystemMetric rows                 (> 30 days old)
//   3. Orphaned RecommendationLog rows         (userId not in User table)
//   4. Expired PendingFeedbackLearning rows    (processAfter > 7 days ago)
//   5. Duplicate UserBehaviorEvent detection   (reports only — never auto-deleted)
//
// Usage:
//   npx tsx scripts/db-cleanup.ts            # dry run — shows what would be deleted
//   npx tsx scripts/db-cleanup.ts --apply    # actually deletes

import { PrismaClient } from '@prisma/client';

// ─── Config ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--apply');
const STALE_DAYS = 30;
const QUEUE_EXPIRY_DAYS = 7;

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`[db-cleanup] ${msg}`); }
function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[db-cleanup] ${title}`);
  console.log('─'.repeat(60));
}

const staleCutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
const queueCutoff = new Date(Date.now() - QUEUE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

// ─── Report ───────────────────────────────────────────────────────────────────

const report: Array<{ task: string; found: number; deleted: number }> = [];

// ─── Task 1: Stale PlannerEvent latency samples ───────────────────────────────

section('1/5  Stale PlannerEvent latency_sample rows (> 30 days)');

const stalePlannerCount = await prisma.plannerEvent.count({
  where: { eventType: 'latency_sample', timestamp: { lt: staleCutoff } },
});

log(`Found ${stalePlannerCount} stale latency_sample rows`);

let deletedPlanner = 0;
if (!DRY_RUN && stalePlannerCount > 0) {
  const result = await prisma.plannerEvent.deleteMany({
    where: { eventType: 'latency_sample', timestamp: { lt: staleCutoff } },
  });
  deletedPlanner = result.count;
  log(`✅ Deleted ${deletedPlanner} rows`);
} else if (DRY_RUN) {
  log(`⏭  DRY RUN — would delete ${stalePlannerCount} rows`);
}
report.push({ task: 'Stale PlannerEvent (latency_sample)', found: stalePlannerCount, deleted: deletedPlanner });

// ─── Task 2: Stale SystemMetric rows ─────────────────────────────────────────

section('2/5  Stale SystemMetric rows (> 30 days)');

const staleMetricCount = await prisma.systemMetric.count({
  where: { timestamp: { lt: staleCutoff } },
});

log(`Found ${staleMetricCount} stale SystemMetric rows`);

let deletedMetrics = 0;
if (!DRY_RUN && staleMetricCount > 0) {
  const result = await prisma.systemMetric.deleteMany({
    where: { timestamp: { lt: staleCutoff } },
  });
  deletedMetrics = result.count;
  log(`✅ Deleted ${deletedMetrics} rows`);
} else if (DRY_RUN) {
  log(`⏭  DRY RUN — would delete ${staleMetricCount} rows`);
}
report.push({ task: 'Stale SystemMetric rows', found: staleMetricCount, deleted: deletedMetrics });

// ─── Task 3: Orphaned RecommendationLog rows ─────────────────────────────────

section('3/5  Orphaned RecommendationLog rows (userId not in User table)');

// Get all userIds in recommendation_logs that have NO matching User
const orphanedUserIds = await prisma.$queryRaw<Array<{ user_id: string }>>`
  SELECT DISTINCT rl.user_id
  FROM recommendation_logs rl
  LEFT JOIN "User" u ON u.id = rl.user_id
  WHERE u.id IS NULL
  LIMIT 1000
`;

const orphanedIds = orphanedUserIds.map((r: { user_id: string }) => r.user_id);
log(`Found ${orphanedIds.length} orphaned userId(s) in RecommendationLog`);

if (orphanedIds.length > 0) {
  const orphanCount = await prisma.recommendationLog.count({
    where: { userId: { in: orphanedIds } },
  });
  log(`  → ${orphanCount} total orphaned rows`);

  let deletedOrphans = 0;
  if (!DRY_RUN && orphanCount > 0) {
    const result = await prisma.recommendationLog.deleteMany({
      where: { userId: { in: orphanedIds } },
    });
    deletedOrphans = result.count;
    log(`✅ Deleted ${deletedOrphans} orphaned rows`);
  } else if (DRY_RUN) {
    log(`⏭  DRY RUN — would delete ${orphanCount} rows`);
  }
  report.push({ task: 'Orphaned RecommendationLog', found: orphanCount, deleted: deletedOrphans });
} else {
  log('✅ No orphaned rows found');
  report.push({ task: 'Orphaned RecommendationLog', found: 0, deleted: 0 });
}

// ─── Task 4: Expired PendingFeedbackLearning rows ────────────────────────────

section('4/5  Expired PendingFeedbackLearning rows (processAfter > 7 days ago)');

const expiredQueueCount = await prisma.pendingFeedbackLearning.count({
  where: { processAfter: { lt: queueCutoff } },
});

log(`Found ${expiredQueueCount} expired queue rows`);

let deletedQueue = 0;
if (!DRY_RUN && expiredQueueCount > 0) {
  const result = await prisma.pendingFeedbackLearning.deleteMany({
    where: { processAfter: { lt: queueCutoff } },
  });
  deletedQueue = result.count;
  log(`✅ Deleted ${deletedQueue} expired rows`);
} else if (DRY_RUN) {
  log(`⏭  DRY RUN — would delete ${expiredQueueCount} rows`);
}
report.push({ task: 'Expired PendingFeedbackLearning', found: expiredQueueCount, deleted: deletedQueue });

// ─── Task 5: Duplicate UserBehaviorEvent detection ───────────────────────────

section('5/5  Duplicate UserBehaviorEvent detection (same user+type+item within 1 minute)');

const duplicates = await prisma.$queryRaw<Array<{
  user_id: string;
  event_type: string;
  item_id: string | null;
  duplicate_count: bigint;
}>>`
  SELECT
    user_id,
    event_type,
    item_id,
    COUNT(*) AS duplicate_count
  FROM user_behavior_events
  GROUP BY
    user_id,
    event_type,
    item_id,
    date_trunc('minute', created_at)
  HAVING COUNT(*) > 1
  ORDER BY duplicate_count DESC
  LIMIT 20
`;

if (duplicates.length === 0) {
  log('✅ No duplicate behavior events detected');
} else {
  log(`⚠️  Found ${duplicates.length} duplicate group(s) — review manually:`);
  for (const d of duplicates) {
    log(`   userId=${d.user_id} type=${d.event_type} itemId=${d.item_id ?? 'null'} count=${d.duplicate_count}`);
  }
  log('   ℹ️  Duplicates are NOT auto-deleted — review and decide manually.');
}
report.push({ task: 'Duplicate UserBehaviorEvent (report only)', found: duplicates.length, deleted: 0 });

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`);
log(`CLEANUP REPORT — ${DRY_RUN ? '🔍 DRY RUN (no changes made)' : '✅ APPLIED'}`);
console.log('═'.repeat(60));

let totalFound = 0;
let totalDeleted = 0;
for (const r of report) {
  const status = DRY_RUN
    ? `found=${r.found}`
    : `found=${r.found} deleted=${r.deleted}`;
  log(`  ${r.task.padEnd(45)} ${status}`);
  totalFound += r.found;
  totalDeleted += r.deleted;
}

console.log('─'.repeat(60));
log(`  TOTAL${' '.repeat(40)} found=${totalFound}${DRY_RUN ? '' : ` deleted=${totalDeleted}`}`);

if (DRY_RUN) {
  log('\n💡 Run with --apply to actually delete the rows.');
}

await prisma.$disconnect();
log('Done.');
process.exit(0);
