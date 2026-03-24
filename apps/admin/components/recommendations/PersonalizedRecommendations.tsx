'use client';

import { Sparkles, Brain, Clock, TrendingUp, FlaskConical, Cpu, Ruler, Zap } from 'lucide-react';

import type { RecommendationItem } from '../../lib/api';

// ─── Re-export so consumers only need one import ──────────────────────────────
export type { RecommendationItem };

interface PersonalizedRecommendationsProps {
  /** Items fetched from GET /recommendations/personalized */
  items?: RecommendationItem[];
  /** Shows animated skeleton cards when true */
  isLoading?: boolean;
  /** Section title override */
  title?: string;
  /**
   * When true, shows the "Mock Data" badge in the header.
   * The backend sets isMock=true while the ML model is still being trained.
   */
  isMock?: boolean;
  /**
   * When true, each card shows an internal scoring overlay:
   * ML score, rule-based score, and final ranking position.
   * Enable via NEXT_PUBLIC_ANALYTICS_DEBUG=true.
   */
  debugMode?: boolean;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-3/5 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full" />
      <div className="h-2 w-4/5 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
      <div className="mt-auto flex justify-between items-center pt-2">
        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        <div className="h-5 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
      </div>
    </div>
  );
}

// ─── Debug Scoring Overlay ────────────────────────────────────────────────────

/** Maps a 0–1 score to a heat colour: red → amber → green */
function heatColor(value: number): string {
  if (value >= 0.75) return '#22c55e'; // green-500
  if (value >= 0.50) return '#f59e0b'; // amber-500
  if (value >= 0.25) return '#f97316'; // orange-500
  return '#ef4444';                    // red-500
}

/** Hex → 15% opacity rgba for backgrounds */
function heatBg(value: number): string {
  if (value >= 0.75) return 'rgba(34,197,94,0.12)';
  if (value >= 0.50) return 'rgba(245,158,11,0.12)';
  if (value >= 0.25) return 'rgba(249,115,22,0.12)';
  return 'rgba(239,68,68,0.12)';
}

interface ScoreGaugeProps {
  label: string;
  value: number;
  /** Show a ▲/▼ delta chip vs another score */
  deltaVs?: number;
}

function ScoreGauge({ label, value, deltaVs }: ScoreGaugeProps) {
  const pct = Math.round(value * 100);
  const color = heatColor(value);
  const bg = heatBg(value);
  const delta = deltaVs != null ? Math.round((value - deltaVs) * 100) : null;

  return (
    <div className="flex flex-col gap-1" title={`Raw: ${value.toFixed(4)}`}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {delta != null && (
            <span
              className="text-[9px] font-bold tabular-nums px-1 py-0.5 rounded"
              style={{
                color: delta >= 0 ? '#22c55e' : '#ef4444',
                backgroundColor: delta >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              }}
            >
              {delta >= 0 ? '▲' : '▼'}{Math.abs(delta)}
            </span>
          )}
          <span
            className="text-[11px] font-bold tabular-nums"
            style={{ color }}
          >
            {pct}
            <span className="text-[9px] font-normal text-zinc-600">%</span>
          </span>
        </div>
      </div>
      {/* Track */}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: bg }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Stacked bar showing ML vs rule-based contribution to the final score */
function ContributionBar({
  mlScore,
  ruleBasedScore,
}: {
  mlScore: number;
  ruleBasedScore: number;
}) {
  const total = mlScore + ruleBasedScore;
  if (total === 0) return null;
  const mlPct = Math.round((mlScore / total) * 100);
  const rulePct = 100 - mlPct;

  return (
    <div className="flex flex-col gap-1 mt-1">
      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
        Weight split
      </span>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${mlPct}%`, backgroundColor: '#818cf8' }}
          title={`ML: ${mlPct}%`}
        />
        <div
          className="h-full flex-1 transition-all duration-700"
          style={{ backgroundColor: '#34d399' }}
          title={`Rule-based: ${rulePct}%`}
        />
      </div>
      <div className="flex justify-between text-[9px] text-zinc-600 tabular-nums">
        <span style={{ color: '#818cf8' }}>ML {mlPct}%</span>
        <span style={{ color: '#34d399' }}>Rule {rulePct}%</span>
      </div>
    </div>
  );
}

function DebugOverlay({ item }: { item: RecommendationItem }) {
  const hasDebugData =
    item.mlScore != null || item.ruleBasedScore != null || item.rankPosition != null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800 font-mono space-y-2.5">
      {/* Header row: label + rank badge */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">
          Score Breakdown
        </span>
        {item.rankPosition != null ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
            #{item.rankPosition} ranked
          </span>
        ) : (
          <span className="text-[9px] text-zinc-600 italic">rank unavailable</span>
        )}
      </div>

      {hasDebugData ? (
        <>
          {/* Three score gauges */}
          <div className="space-y-2">
            {item.mlScore != null && (
              <ScoreGauge
                label="ML Score"
                value={item.mlScore}
                deltaVs={item.ruleBasedScore}
              />
            )}
            {item.ruleBasedScore != null && (
              <ScoreGauge
                label="Rule-Based"
                value={item.ruleBasedScore}
                deltaVs={item.mlScore}
              />
            )}
            {item.score != null && (
              <ScoreGauge label="Final (combined)" value={item.score} />
            )}
          </div>

          {/* Contribution bar — only when both scores present */}
          {item.mlScore != null && item.ruleBasedScore != null && (
            <ContributionBar mlScore={item.mlScore} ruleBasedScore={item.ruleBasedScore} />
          )}

          <p className="text-[9px] text-zinc-600 italic">
            Hover gauges for 4-decimal raw values
          </p>
        </>
      ) : (
        <p className="text-[9px] text-zinc-600 italic">
          No debug data — backend must send{' '}
          <span className="text-zinc-500">mlScore</span> /{' '}
          <span className="text-zinc-500">ruleBasedScore</span> in response.
        </p>
      )}
    </div>
  );
}


// ─── Source Indicator Chip ────────────────────────────────────────────────────
/**
 * Displays which recommendation engine produced this result.
 * Always visible (not gated behind debugMode) — useful for all developers
 * and internal testers reviewing the recommendation rollout.
 */
function SourceChip({ source }: { source: RecommendationItem['source'] }) {
  if (!source) return null;

  const config = {
    ml: {
      label: 'ML',
      icon: <Cpu className="w-2.5 h-2.5" />,
      className:
        'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    },
    rule_based: {
      label: 'Rule-Based',
      icon: <Ruler className="w-2.5 h-2.5" />,
      className:
        'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    },
    hybrid: {
      label: 'Hybrid',
      icon: <Zap className="w-2.5 h-2.5" />,
      className:
        'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    },
  } as const;

  const { label, icon, className } = config[source];

  return (
    <span
      className={`inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

import { useAnalyticsTracker } from '../../hooks/useAnalyticsTracker';

// ─── Populated Card ───────────────────────────────────────────────────────────
function RecommendationCard({
  item,
  debugMode,
  onTrack,
  onSave,
  onIgnore,
}: {
  item: RecommendationItem;
  debugMode: boolean;
  onTrack?: (id: string) => void;
  onSave?: (id: string, e: React.MouseEvent) => void;
  onIgnore?: (id: string, e: React.MouseEvent) => void;
}) {
  const confidencePct = item.score != null ? Math.round(item.score * 100) : null;

  return (
    <div
      onClick={() => onTrack?.(item.id)}
      className={`rounded-xl border p-5 flex flex-col gap-2 hover:shadow-md transition-all group cursor-pointer ${
        debugMode
          ? 'bg-zinc-950 border-zinc-700 hover:border-zinc-600'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Top row: tag + source chip */}
      {(item.tag || item.source) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
              <TrendingUp className="w-3 h-3" />
              {item.tag}
            </span>
          )}
          <SourceChip source={item.source} />
        </div>
      )}
      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
        {item.title}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
        {item.description}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => onSave?.(item.id, e)}
          className="text-[10px] font-semibold select-none px-2.5 py-1.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-zinc-200 dark:border-zinc-700 hover:border-emerald-200 dark:hover:border-emerald-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          Save for later
        </button>
        <button
          onClick={(e) => onIgnore?.(item.id, e)}
          className="text-[10px] font-semibold select-none px-2.5 py-1.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 border-zinc-200 dark:border-zinc-700 hover:border-rose-200 dark:hover:border-rose-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
        >
          Not interested
        </button>
      </div>

      {/* Public confidence bar (non-debug) */}
      {!debugMode && confidencePct != null && (
        <div className="mt-auto pt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-400 dark:bg-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-zinc-400 tabular-nums">
            {confidencePct}%
          </span>
        </div>
      )}

      {/* Debug scoring overlay */}
      {debugMode && <DebugOverlay item={item} />}
    </div>
  );
}


// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-14 gap-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Brain className="w-6 h-6 text-zinc-400" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-zinc-700 dark:text-zinc-300">No recommendations yet</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
          The model hasn&apos;t generated any suggestions for this user yet.
        </p>
      </div>
    </div>
  );
}

// ─── Unavailable state ────────────────────────────────────────────────────────
function UnavailableState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-14 gap-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-violet-200 dark:bg-violet-900/40 opacity-50" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <Brain className="w-7 h-7 text-violet-500 dark:text-violet-400" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Recommendations unavailable</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
          Could not reach the recommendation service. It will retry on the next refresh.
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <Clock className="w-3.5 h-3.5" />
        Retrying on next refresh
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PersonalizedRecommendations({
  items,
  isLoading = false,
  title = 'Personalized Recommendations',
  isMock = false,
  debugMode = false,
}: PersonalizedRecommendationsProps) {
  const SKELETON_COUNT = 3;
  const { track } = useAnalyticsTracker({ debugMode });

  const handleTrackInteraction = (id: string) => {
    track('trip_clicked', { tripId: id, source: 'personalized_recommendation' });
  };

  const handleSaveInteraction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    track('recommendation_saved', { destinationId: id, source: 'personalized_recommendation' });
  };

  const handleIgnoreInteraction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    track('recommendation_ignored', { destinationId: id, source: 'personalized_recommendation' });
  };

  return (
    <section
      className={`rounded-xl border shadow-sm overflow-hidden ${
        debugMode
          ? 'bg-zinc-950 border-zinc-800'
          : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-6 border-b ${
          debugMode ? 'border-zinc-800' : 'border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg leading-tight">{title}</h3>
              {isMock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <FlaskConical className="w-3 h-3" />
                  Mock Data
                </span>
              )}
              {debugMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono">
                  🔬 Debug Mode
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {debugMode
                ? 'Showing ML score · Rule-based score · Final rank per card'
                : 'AI-powered suggestions tailored per user behaviour'}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
          <Brain className="w-3 h-3" />
          ML Powered
        </span>
      </div>

      {/* Cards grid */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)
        ) : items === undefined ? (
          <UnavailableState />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item) => (
            <RecommendationCard
              key={item.id}
              item={item}
              debugMode={debugMode}
              onTrack={handleTrackInteraction}
              onSave={handleSaveInteraction}
              onIgnore={handleIgnoreInteraction}
            />
          ))
        )}
      </div>
    </section>
  );
}

