import { Sparkles, Brain, Clock, TrendingUp, FlaskConical } from 'lucide-react';
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
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function DebugOverlay({ item }: { item: RecommendationItem }) {
  const hasDebugData =
    item.mlScore != null || item.ruleBasedScore != null || item.rankPosition != null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800 font-mono">
      {/* Rank badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">
          Debug Scores
        </span>
        {item.rankPosition != null ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
            Rank #{item.rankPosition}
          </span>
        ) : (
          <span className="text-[9px] text-zinc-600">rank —</span>
        )}
      </div>

      {hasDebugData ? (
        <div className="flex flex-col gap-1.5">
          {item.mlScore != null && (
            <ScoreBar label="ML Score" value={item.mlScore} color="#818cf8" />
          )}
          {item.ruleBasedScore != null && (
            <ScoreBar label="Rule-Based" value={item.ruleBasedScore} color="#34d399" />
          )}
          {item.score != null && (
            <ScoreBar label="Final Score" value={item.score} color="#f59e0b" />
          )}
        </div>
      ) : (
        <p className="text-[9px] text-zinc-600 italic">
          No debug data — backend must include mlScore / ruleBasedScore in response.
        </p>
      )}
    </div>
  );
}

// ─── Populated Card ───────────────────────────────────────────────────────────
function RecommendationCard({
  item,
  debugMode,
}: {
  item: RecommendationItem;
  debugMode: boolean;
}) {
  const confidencePct = item.score != null ? Math.round(item.score * 100) : null;

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-2 hover:shadow-md transition-all group ${
        debugMode
          ? 'bg-zinc-950 border-zinc-700 hover:border-zinc-600'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {item.tag && (
        <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
          <TrendingUp className="w-3 h-3" />
          {item.tag}
        </span>
      )}
      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
        {item.title}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
        {item.description}
      </p>

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
            <RecommendationCard key={item.id} item={item} debugMode={debugMode} />
          ))
        )}
      </div>
    </section>
  );
}
