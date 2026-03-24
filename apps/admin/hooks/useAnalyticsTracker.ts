'use client';

import { useCallback, useRef, useState } from 'react';

// ─── Event Catalogue ─────────────────────────────────────────────────────────
export type EngagementEventName =
  | 'trip_clicked'
  | 'destination_viewed'
  | 'planner_edit'
  | 'trip_accepted'
  | 'trip_rejected';

export interface EngagementEventPayload {
  tripId?: string;
  destinationId?: string;
  userId?: string;
  /** Any additional context that's useful as an ML signal */
  [key: string]: unknown;
}

// ─── Debug log entry ─────────────────────────────────────────────────────────
export interface TrackerLogEntry {
  id: string;
  event: EngagementEventName;
  payload: EngagementEventPayload;
  timestamp: number;
  /**
   * 'pending' → queued, 'sent' → flushed to API, 'error' → network failed
   * 'demo'    → injected locally for HUD preview only (never hits the backend)
   */
  status: 'pending' | 'sent' | 'error' | 'demo';
}

// ─── Flush helpers ───────────────────────────────────────────────────────────
/**
 * Best-effort, fire-and-forget POST.
 * Returns true if the request succeeded, false otherwise.
 * Errors are never re-thrown — tracking must NEVER break the UI.
 */
async function sendEvent(
  event: EngagementEventName,
  payload: EngagementEventPayload,
): Promise<boolean> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
  try {
    const res = await fetch(`${API_BASE}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: Date.now(), ...payload }),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Batch queue ─────────────────────────────────────────────────────────────
interface QueuedEvent {
  entry: TrackerLogEntry;
  onStatusChange: (id: string, status: TrackerLogEntry['status']) => void;
}

const BATCH_DELAY_MS = 1000; // flush at most once per second
const MAX_LOG_SIZE    = 50;  // keep the latest N entries in debug view

// ─── Hook ────────────────────────────────────────────────────────────────────
/**
 * useAnalyticsTracker
 *
 * Returns:
 *  - `track(event, payload?)` — enqueues an event (fire-and-forget, idle-scheduled)
 *  - `log` — ordered list of `TrackerLogEntry` for the debug panel (empty in prod)
 *  - `clearLog()` — resets the debug log
 *
 * Debug mode is enabled by setting `debugMode = true`.
 * In debug mode each event moves through: pending → sent | error.
 *
 * Performance guardrails:
 *  1. Events are batched with a 1-second debounce.
 *  2. Flush is scheduled via requestIdleCallback (falls back to setTimeout).
 *  3. Never blocks the rendering thread.
 *  4. Network errors are silently swallowed.
 *
 * @example
 *   const { track } = useAnalyticsTracker();
 *   track('trip_clicked', { tripId: trip.id });
 *
 * @example — debug mode
 *   const { track, log } = useAnalyticsTracker({ debugMode: true });
 */
export function useAnalyticsTracker({ debugMode = false }: { debugMode?: boolean } = {}) {
  const queueRef  = useRef<QueuedEvent[]>([]);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [log, setLog] = useState<TrackerLogEntry[]>([]);

  // Update a log entry's status (debug only)
  const updateStatus = useCallback((id: string, status: TrackerLogEntry['status']) => {
    if (!debugMode) return;
    setLog(prev =>
      prev.map(e => (e.id === id ? { ...e, status } : e)),
    );
  }, [debugMode]);

  const flush = useCallback(() => {
    const batch = queueRef.current.splice(0);
    if (batch.length === 0) return;

    const schedule =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (cb: () => void) =>
            (window as Window & typeof globalThis).requestIdleCallback(cb, { timeout: 3000 })
        : (cb: () => void) => setTimeout(cb, 0);

    schedule(() => {
      batch.forEach(({ entry, onStatusChange }) => {
        sendEvent(entry.event, entry.payload).then(ok => {
          onStatusChange(entry.id, ok ? 'sent' : 'error');
        });
      });
    });
  }, []);

  const track = useCallback(
    (event: EngagementEventName, payload: EngagementEventPayload = {}) => {
      const entry: TrackerLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        event,
        payload,
        timestamp: Date.now(),
        status: 'pending',
      };

      // Add to debug log (capped at MAX_LOG_SIZE, newest first)
      if (debugMode) {
        setLog(prev => [entry, ...prev].slice(0, MAX_LOG_SIZE));
      }

      queueRef.current.push({ entry, onStatusChange: updateStatus });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, BATCH_DELAY_MS);
    },
    [debugMode, flush, updateStatus],
  );

  const clearLog = useCallback(() => setLog([]), []);

  /**
   * injectDemoEntry
   * Adds a synthetic log entry directly into the HUD with status=sent,
   * WITHOUT calling track() or making any network request.
   * Used by AnalyticsDebugWrapper to demo the panel without polluting the DB.
   */
  const injectDemoEntry = useCallback(
    (event: EngagementEventName, payload: EngagementEventPayload = {}) => {
      if (!debugMode) return;
      const entry: TrackerLogEntry = {
        id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        event,
        payload,
        timestamp: Date.now(),
        status: 'demo', // visually distinct — never sent to backend
      };
      setLog((prev) => [entry, ...prev].slice(0, MAX_LOG_SIZE));
    },
    [debugMode],
  );

  return { track, log, clearLog, injectDemoEntry };
}
