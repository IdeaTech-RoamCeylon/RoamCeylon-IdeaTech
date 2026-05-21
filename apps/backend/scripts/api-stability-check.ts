#!/usr/bin/env tsx
// apps/backend/scripts/api-stability-check.ts
//
// API Stability Verification Script — Day 67 Task 2
//
// Verifies all backend endpoints are working, returning correct response shapes,
// and responding within acceptable latency thresholds.
//
// Usage:
//   npx tsx scripts/api-stability-check.ts
//   npx tsx scripts/api-stability-check.ts --url http://staging.your-app.com
//
// Exit codes:
//   0 — All checks passed
//   1 — One or more checks failed

import { performance } from 'perf_hooks';

// ─── Config ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='))?.split('=')[1];
const BASE_URL = urlArg ?? process.env.API_URL ?? 'http://localhost:3001';
const LATENCY_WARN_MS = 500;
const LATENCY_FAIL_MS = 5000;
const TEST_USER_ID = 'stability-check-user';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  name: string;
  method: string;
  path: string;
  passed: boolean;
  status?: number;
  durationMs: number;
  error?: string;
  warnings: string[];
}

// ─── Test definitions ─────────────────────────────────────────────────────────

type TestCase = {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
  expectedStatus: number[];
  requiredFields?: string[];
};

const TEST_CASES: TestCase[] = [
  // ── Liveness ────────────────────────────────────────────────────────────────
  {
    name: 'Health check',
    method: 'GET',
    path: '/health',
    expectedStatus: [200],
    requiredFields: ['status', 'uptime', 'timestamp'],
  },

  // ── ML Recommendations ───────────────────────────────────────────────────────
  {
    name: 'Personalized recommendations',
    method: 'GET',
    path: `/api/recommendations/personalized?userId=${TEST_USER_ID}`,
    expectedStatus: [200],
    requiredFields: ['data'],
  },

  // ── Behavior tracking ────────────────────────────────────────────────────────
  {
    name: 'Track behavior event',
    method: 'POST',
    path: '/api/behavior/track',
    body: {
      user_id: TEST_USER_ID,
      event_type: 'stability_check',
      item_id: 'trip_001',
      metadata: { source: 'api-stability-check' },
    },
    expectedStatus: [200, 201],
    requiredFields: ['data'],
  },

  // ── ML Health & Monitoring ───────────────────────────────────────────────────
  {
    name: 'ML system health',
    method: 'GET',
    path: '/api/ml/health',
    expectedStatus: [200],
    requiredFields: ['status', 'circuitBreakers', 'cache', 'queue', 'system', 'timestamp'],
  },
  {
    name: 'Cache statistics',
    method: 'GET',
    path: '/api/ml/cache/stats',
    expectedStatus: [200],
    requiredFields: ['data'],
  },
  {
    name: 'Queue statistics',
    method: 'GET',
    path: '/api/ml/queue/stats',
    expectedStatus: [200],
    requiredFields: ['data'],
  },

  // ── Retraining pipeline ──────────────────────────────────────────────────────
  {
    name: 'Retraining pipeline status',
    method: 'GET',
    path: '/api/ml/retrain/status',
    expectedStatus: [200],
    requiredFields: ['data'],
  },

  // ── Incremental learning ─────────────────────────────────────────────────────
  {
    name: 'Incremental learning status',
    method: 'GET',
    path: `/api/ml/incremental/status/${TEST_USER_ID}`,
    expectedStatus: [200],
    requiredFields: ['data'],
  },

  // ── Input validation (should reject bad input) ───────────────────────────────
  {
    name: 'Validation: userId too long (should reject)',
    method: 'GET',
    path: `/api/recommendations/personalized?userId=${'x'.repeat(200)}`,
    expectedStatus: [400],
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runCheck(tc: TestCase): Promise<CheckResult> {
  const warnings: string[] = [];
  const url = `${BASE_URL}${tc.path}`;
  const start = performance.now();

  try {
    const opts: RequestInit = {
      method: tc.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (tc.body) {
      opts.body = JSON.stringify(tc.body);
    }

    const res = await fetch(url, opts);
    const durationMs = Math.round(performance.now() - start);

    if (durationMs > LATENCY_WARN_MS) {
      warnings.push(`Slow response: ${durationMs}ms (threshold: ${LATENCY_WARN_MS}ms)`);
    }

    const statusOk = tc.expectedStatus.includes(res.status);
    if (!statusOk) {
      return {
        name: tc.name,
        method: tc.method,
        path: tc.path,
        passed: false,
        status: res.status,
        durationMs,
        error: `Expected status ${tc.expectedStatus.join('|')}, got ${res.status}`,
        warnings,
      };
    }

    // Check required fields
    if (tc.requiredFields && tc.requiredFields.length > 0 && res.status !== 400) {
      let body: Record<string, unknown> = {};
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        return {
          name: tc.name, method: tc.method, path: tc.path,
          passed: false, status: res.status, durationMs,
          error: 'Response body is not valid JSON', warnings,
        };
      }

      const missingFields = tc.requiredFields.filter((f) => !(f in body));
      if (missingFields.length > 0) {
        return {
          name: tc.name, method: tc.method, path: tc.path,
          passed: false, status: res.status, durationMs,
          error: `Missing fields in response: ${missingFields.join(', ')}`,
          warnings,
        };
      }
    }

    if (durationMs > LATENCY_FAIL_MS) {
      return {
        name: tc.name, method: tc.method, path: tc.path,
        passed: false, status: res.status, durationMs,
        error: `Response exceeded hard latency limit: ${durationMs}ms > ${LATENCY_FAIL_MS}ms`,
        warnings,
      };
    }

    return {
      name: tc.name, method: tc.method, path: tc.path,
      passed: true, status: res.status, durationMs, warnings,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    return {
      name: tc.name, method: tc.method, path: tc.path,
      passed: false, durationMs,
      error: `Network error: ${(err as Error).message}`,
      warnings,
    };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n🔍 RoamCeylon API Stability Check`);
console.log(`   Target: ${BASE_URL}`);
console.log(`   Checks: ${TEST_CASES.length}`);
console.log(`   Latency warn: ${LATENCY_WARN_MS}ms | fail: ${LATENCY_FAIL_MS}ms\n`);
console.log('─'.repeat(70));

const results: CheckResult[] = [];

for (const tc of TEST_CASES) {
  const result = await runCheck(tc);
  results.push(result);

  const icon = result.passed ? '✅' : '❌';
  const warn = result.warnings.length > 0 ? ' ⚠️ ' : '';
  const status = result.status ? ` [${result.status}]` : '';
  const latency = ` ${result.durationMs}ms`;

  console.log(
    `${icon}${warn} ${result.method.padEnd(5)} ${result.path.padEnd(50)}${status.padEnd(6)}${latency}`
  );

  if (!result.passed && result.error) {
    console.log(`   └─ Error: ${result.error}`);
  }
  for (const w of result.warnings) {
    console.log(`   └─ ⚠️  ${w}`);
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(70));

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const warned = results.filter((r) => r.warnings.length > 0).length;
const avgLatency = Math.round(results.reduce((sum, r) => sum + r.durationMs, 0) / results.length);
const maxLatency = Math.max(...results.map((r) => r.durationMs));

console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${warned} with warnings`);
console.log(`⏱  Latency: avg ${avgLatency}ms | max ${maxLatency}ms`);

if (failed > 0) {
  console.log('\n❌ STABILITY CHECK FAILED — see errors above');
  process.exit(1);
} else if (warned > 0) {
  console.log('\n⚠️  All checks passed but some responses were slow');
  process.exit(0);
} else {
  console.log('\n✅ ALL CHECKS PASSED — system is stable and ready');
  process.exit(0);
}
