// apps/admin/lib/featureFlags.ts
// Server-side only — never import this from a 'use client' component.

/**
 * Supported feature flags.
 * Add new flags here as a union type to keep usage type-safe.
 */
export type FeatureFlag = 'ml_recommendations_enabled';

// ─── Config (read from env at module load) ────────────────────────────────────

/**
 * Comma-separated list of user IDs that always have the flag enabled.
 * Set via: ML_RECOMMENDATIONS_ALLOWLIST=admin,user123
 */
const ALLOWLIST: Set<string> = new Set(
  (process.env.ML_RECOMMENDATIONS_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/**
 * Percentage of users that see the feature (0–100).
 * Parsed once at startup; falls back to 0 (disabled) on bad input.
 * Set via: ML_RECOMMENDATIONS_ROLLOUT_PCT=10
 */
const ROLLOUT_PCT: number = (() => {
  const raw = process.env.ML_RECOMMENDATIONS_ROLLOUT_PCT;
  if (!raw) return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
})();

// ─── Deterministic hash ───────────────────────────────────────────────────────
/**
 * djb2 hash → maps a userId string to a stable 0–100 bucket.
 * Same userId always lands in the same bucket, ensuring consistent
 * user experience across page loads and server restarts.
 */
function userBucket(userId: string): number {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 33) ^ userId.charCodeAt(i);
    hash = hash >>> 0; // keep as unsigned 32-bit
  }
  return hash % 100; // 0–99
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * isFeatureEnabled
 *
 * Evaluates whether a feature flag is active for a given user.
 *
 * Evaluation order:
 *  1. Allowlist — if userId is in ML_RECOMMENDATIONS_ALLOWLIST → always ON
 *  2. Rollout   — if userBucket(userId) < ML_RECOMMENDATIONS_ROLLOUT_PCT → ON
 *  3. Default   → OFF
 *
 * @param flag    - The feature flag name to evaluate.
 * @param userId  - Identifies the user. Defaults to 'admin' in the admin dashboard.
 *
 * @example
 *   // .env.local
 *   ML_RECOMMENDATIONS_ALLOWLIST=admin,tester42
 *   ML_RECOMMENDATIONS_ROLLOUT_PCT=10
 *
 *   isFeatureEnabled('ml_recommendations_enabled', 'admin')     // → true  (allowlist)
 *   isFeatureEnabled('ml_recommendations_enabled', 'tester42')  // → true  (allowlist)
 *   isFeatureEnabled('ml_recommendations_enabled', 'user999')   // → depends on bucket
 */
export function isFeatureEnabled(flag: FeatureFlag, userId = 'admin'): boolean {
  try {
    // 1. Allowlist always wins
    if (ALLOWLIST.has(userId)) return true;

    // 2. Percentage rollout — deterministic per userId
    if (ROLLOUT_PCT > 0 && userBucket(userId) < ROLLOUT_PCT) return true;

    return false;
  } catch {
    // Never crash the page due to a flag evaluation error
    return false;
  }
}

/**
 * getFeatureFlagMeta
 *
 * Returns diagnostics about the current flag config.
 * Safe to log server-side for debugging — do NOT send to clients.
 */
export function getFeatureFlagMeta() {
  return {
    allowlistSize: ALLOWLIST.size,
    rolloutPct: ROLLOUT_PCT,
    allowlist: Array.from(ALLOWLIST),
  };
}
