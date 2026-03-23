// apps/admin/lib/api.ts

// ─── Engagement Event Types (ML Training Signals) ─────────────────────────────
export type EngagementEventType =
  | 'trip_clicked'
  | 'destination_viewed'
  | 'planner_edit'
  | 'trip_accepted'
  | 'trip_rejected';

export interface EngagementEventCount {
  eventType: EngagementEventType;
  count: number;
}

export interface EngagementStatsResponse {
  totalEvents: number;
  breakdown: EngagementEventCount[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export interface PlannerDailyMetric {
  eventType: string;
  count: number;
}

export interface PlannerDailyStatsResponse {
  date: string;
  totalEvents: number;
  avgResponseTimeMs: number;
  recentResponseTimes: number[];
  last7Days: {
    date: string;
    count: number;
  }[];
  breakdown: PlannerDailyMetric[];
}

export interface FeedbackRateMetric {
  submissionRate: number;
  positiveFeedbackPercentage: number;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
  last7Days: {
    date: string;
    count: number;
  }[];
}

export interface SystemErrorMetric {
  errorCount: number;
  totalRequests: number;
  errorRate: string | number;
}

export async function getPlannerDailyStats(): Promise<PlannerDailyStatsResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/planner/daily`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch planner stats');
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function getFeedbackRate(): Promise<FeedbackRateMetric | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/feedback/rate`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch feedback rate');
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function getSystemErrors(): Promise<SystemErrorMetric | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/system/errors`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch system errors');
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget engagement event tracker.
 * Safe to call from client components — never throws, never blocks.
 */
export function trackEngagementEvent(
  event: EngagementEventType,
  payload: Record<string, unknown> = {},
): void {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
  // Intentionally NOT awaited
  fetch(`${API_BASE}/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, timestamp: Date.now(), ...payload }),
    keepalive: true,
  }).catch(() => {
    // Silently swallow — tracking must never surface errors to users
  });
}

/**
 * Fetches aggregate engagement event counts for the dashboard.
 * Returns null on any failure (graceful degradation).
 */
export async function getEngagementStats(): Promise<EngagementStatsResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/events/summary`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch engagement stats');
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// ─── Personalized Recommendations ────────────────────────────────────────────
export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  /** Combined/final ML confidence score 0–1 (used for the public progress bar) */
  score?: number;
  /** Display badge, e.g. "Trending", "Personalized", "Popular" */
  tag?: string;
  destinationId?: string;

  // ─── Debug-only scoring fields ────────────────────────────────────────────
  /** Raw ML model output score 0–1 (only present when backend sends debug data) */
  mlScore?: number;
  /** Rule-based heuristic score 0–1 (business logic layer) */
  ruleBasedScore?: number;
  /** Final position in the ranked results list (1-indexed) */
  rankPosition?: number;
}

export interface PersonalizedRecommendationsResponse {
  userId?: string;
  generatedAt: string;
  items: RecommendationItem[];
  /** true when the model is live; false means mock/fallback data */
  isMock: boolean;
}

/**
 * Fetches personalized recommendations from the ML service.
 * Currently returns mock data while the model is being trained.
 * Returns null on any network/server failure.
 */
export async function getPersonalizedRecommendations(): Promise<PersonalizedRecommendationsResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/recommendations/personalized`, {
      next: { revalidate: 120 }, // recommendations can be slightly staler
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}
