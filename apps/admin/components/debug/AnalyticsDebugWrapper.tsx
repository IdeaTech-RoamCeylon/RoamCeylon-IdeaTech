'use client';

/**
 * AnalyticsDebugWrapper
 *
 * Mounts useAnalyticsTracker in debug mode and renders the AnalyticsDebugPanel.
 * Only rendered when NEXT_PUBLIC_ANALYTICS_DEBUG=true.
 *
 * Demo events are injected directly into the HUD log (via injectDemoEntry)
 * so the panel is pre-populated on load — they do NOT POST to the backend
 * and do NOT appear in the real database or engagement event counts.
 *
 * Real events from actual user interactions go through track() as normal.
 */

import { useEffect } from 'react';
import { useAnalyticsTracker, type EngagementEventName } from '../../hooks/useAnalyticsTracker';
import { AnalyticsDebugPanel } from './AnalyticsDebugPanel';

const DEMO_EVENTS: { event: EngagementEventName; payload: Record<string, string> }[] = [
  { event: 'trip_clicked',       payload: { tripId: 'trip_001' } },
  { event: 'destination_viewed', payload: { destinationId: 'dest_kandy' } },
  { event: 'planner_edit',       payload: { tripId: 'trip_001', field: 'hotel' } },
  { event: 'trip_accepted',      payload: { tripId: 'trip_002' } },
  { event: 'trip_rejected',      payload: { tripId: 'trip_003', reason: 'too_expensive' } },
];

export function AnalyticsDebugWrapper() {
  const { track, log, clearLog, injectDemoEntry } = useAnalyticsTracker({ debugMode: true });

  // Inject demo entries into the HUD only — no network calls, no DB writes
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      const { event, payload } = DEMO_EVENTS[idx % DEMO_EVENTS.length];
      injectDemoEntry(event, payload); // ← HUD only, not track()
      idx++;
    }, 2500);
    return () => clearInterval(interval);
  }, [injectDemoEntry]);

  // track is available here for real interactions wired to this component
  void track;

  return <AnalyticsDebugPanel log={log} onClear={clearLog} />;
}
