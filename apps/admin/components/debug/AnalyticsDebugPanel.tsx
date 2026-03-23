'use client';

import { useState } from 'react';
import { Bug, ChevronDown, ChevronUp, Trash2, Circle, CheckCircle2, XCircle } from 'lucide-react';
import type { TrackerLogEntry } from '../../hooks/useAnalyticsTracker';

interface AnalyticsDebugPanelProps {
  log: TrackerLogEntry[];
  onClear: () => void;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TrackerLogEntry['status'] }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
        <Circle className="w-2.5 h-2.5 animate-pulse" />
        pending
      </span>
    );
  }
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-2.5 h-2.5" />
        sent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
      <XCircle className="w-2.5 h-2.5" />
      error
    </span>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
/**
 * AnalyticsDebugPanel
 *
 * A collapsible developer overlay that shows tracked events in real-time.
 * Each entry displays the event name, payload, timestamp, and current status
 * (pending → sent | error) as the network request completes.
 *
 * Only rendered when `debugMode` is enabled in `useAnalyticsTracker`.
 * Should never be shown in production.
 */
export function AnalyticsDebugPanel({ log, onClear }: AnalyticsDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const sentCount    = log.filter(e => e.status === 'sent').length;
  const pendingCount = log.filter(e => e.status === 'pending').length;
  const errorCount   = log.filter(e => e.status === 'error').length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[420px] max-h-[560px] flex flex-col rounded-xl border border-zinc-700 bg-zinc-950/95 shadow-2xl backdrop-blur-md font-mono text-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-zinc-100 text-[11px] uppercase tracking-widest">
            Analytics Debug
          </span>
          {/* Live counters */}
          <div className="flex items-center gap-1.5 ml-2">
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                {pendingCount} pending
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              {sentCount} sent
            </span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                {errorCount} err
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(o => !o)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Log entries */}
      {isOpen && (
        <div className="overflow-y-auto flex-1">
          {log.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-600">
              <Bug className="w-6 h-6" />
              <p className="text-[11px]">No events tracked yet. Interact with the page.</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {log.map((entry) => (
                <li key={entry.id} className="px-4 py-2.5 hover:bg-zinc-900/60 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    {/* Event name chip */}
                    <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold text-[10px] tracking-wide">
                      {entry.event}
                    </span>
                    <StatusBadge status={entry.status} />
                  </div>
                  {/* Timestamp */}
                  <p className="text-zinc-600 text-[10px] mb-1">
                    {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3,
                    })}
                  </p>
                  {/* Payload */}
                  {Object.keys(entry.payload).length > 0 && (
                    <pre className="text-[10px] text-zinc-400 bg-zinc-900 rounded p-2 overflow-x-auto leading-relaxed">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
