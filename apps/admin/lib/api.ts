// apps/admin/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface PlannerDailyMetric {
  eventType: string;
  _count: {
    _all: number;
  };
}

export interface PlannerDailyStatsResponse {
  date: string;
  totalEvents: number;
  avgResponseTimeMs: number;
  breakdown: PlannerDailyMetric[];
}

export interface FeedbackRateMetric {
  submissionRate: number;
  positiveFeedbackPercentage: number;
  last7Days: {
    date: string;
    count: number;
  }[];
}

export interface SystemErrorMetric {
  totalErrors: number;
  errorRate: number;
}

export async function getPlannerDailyStats(): Promise<PlannerDailyStatsResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/planner/daily`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch planner stats');
    return await res.json();
  } catch (error) {
    console.error('Error fetching planner daily stats:', error);
    return null;
  }
}

export async function getFeedbackRate(): Promise<FeedbackRateMetric | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/feedback/rate`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch feedback rate');
    return await res.json();
  } catch (error) {
    console.error('Error fetching feedback rate:', error);
    return null;
  }
}

export async function getSystemErrors(): Promise<SystemErrorMetric | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/system/errors`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch system errors');
    return await res.json();
  } catch (error) {
    console.error('Error fetching system errors:', error);
    return null;
  }
}
