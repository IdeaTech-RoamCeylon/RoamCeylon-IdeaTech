'use client';

/**
 * AnalyticsDebugWrapper
 *
 * Client component that mounts useAnalyticsTracker in debug mode
 * and renders the AnalyticsDebugPanel overlay.
 *
 * Only rendered when NEXT_PUBLIC_ANALYTICS_DEBUG=true.
 * Demo events are emitted on a timer so developers see the panel
 * populate immediately without needing to interact with the page.
 */

import { useEffect } from 'react';
import { useAnalyticsTracker, type EngagementEventName } from '../../hooks/useAnalyticsTracker';
import { AnalyticsDebugPanel } from './AnalyticsDebugPanel';

// Demo sequence that cycles through all tracked event types
const DEMO_EVENTS: { event: EngagementEventName; payload: Record<string, string> }[] = [
  { event: 'trip_clicked',       payload: { tripId: 'trip_001' } },
  { event: 'destination_viewed', payload: { destinationId: 'dest_kandy' } },
  { event: 'planner_edit',       payload: { tripId: 'trip_001', field: 'hotel' } },
  { event: 'trip_accepted',      payload: { tripId: 'trip_002' } },
  { event: 'trip_rejected',      payload: { tripId: 'trip_003', reason: 'too_expensive' } },
];

export function AnalyticsDebugWrapper() {
  const { track, log, clearLog } = useAnalyticsTracker({ debugMode: true });

  // Emit one demo event every 2.5s so the panel is populated immediately
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      const { event, payload } = DEMO_EVENTS[idx % DEMO_EVENTS.length];
      track(event, payload);
      idx++;
    }, 2500);
    return () => clearInterval(interval);
  }, [track]);

  return <AnalyticsDebugPanel log={log} onClear={clearLog} />;
}
