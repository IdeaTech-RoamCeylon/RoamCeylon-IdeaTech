'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Brain, Clock, TrendingUp, Cpu, Ruler, Zap } from 'lucide-react';

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
const RecommendationCard = React.memo(function RecommendationCard({
  item,
  onTrack,
  onSave,
  onIgnore,
  onDislike,
}: {
  item: RecommendationItem;
  onTrack?: (id: string) => void;
  onSave?: (id: string, e: React.MouseEvent) => void;
  onIgnore?: (id: string, e: React.MouseEvent) => void;
  onDislike?: (id: string, e: React.MouseEvent) => void;
}) {
  const confidencePct = item.score != null ? Math.round(item.score * 100) : null;

  return (
    <div
      onClick={() => onTrack?.(item.id)}
      className="rounded-xl border p-5 flex flex-col gap-2 hover:shadow-md transition-all group cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
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
        <button
          onClick={(e) => onDislike?.(item.id, e)}
          className="text-[10px] font-semibold select-none px-2.5 py-1.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 border-zinc-200 dark:border-zinc-700 hover:border-rose-200 dark:hover:border-rose-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
        >
          Dislike
        </button>
      </div>

      {/* Public confidence bar */}
      {confidencePct != null && (
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
    </div>
  );
});


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
function UnavailableState({ onRetry }: { onRetry?: () => void }) {
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
          Could not reach the recommendation service.
        </p>
      </div>
      {onRetry ? (
        <button onClick={onRetry} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition">
          <Clock className="w-4 h-4" />
          Retry Now
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3.5 h-3.5" />
          Retrying on next refresh
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PersonalizedRecommendations({
  items: initialItems,
  isLoading: initialIsLoading = false,
  title = 'Personalized Recommendations',
}: PersonalizedRecommendationsProps) {
  const SKELETON_COUNT = 3;
  const { track } = useAnalyticsTracker();

  const [items, setItems] = useState<RecommendationItem[] | undefined>(initialItems);
  const [isLoading, setIsLoading] = useState(initialIsLoading);
  const [error, setError] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setIsLoading(initialIsLoading);
  }, [initialIsLoading]);

  const refreshRecommendations = useCallback(async (isBackground = false) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (!isBackground) setIsLoading(true);
      setError(false);
      
      const { getPersonalizedRecommendations } = await import('../../lib/api');
      const data = await getPersonalizedRecommendations({ signal: abortControllerRef.current.signal });
      
      if (data?.items) {
        setItems(prev => {
          if (prev && prev.length === data.items.length && prev.every((p, i) => p.id === data.items[i].id)) {
            return prev;
          }
          return data.items;
        });
      } else {
        setError(true);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Failed to refresh recommendations:', e);
        setError(true);
      }
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshRecommendations(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshRecommendations]);

  const handleTrackInteraction = useCallback((id: string) => {
    track('trip_clicked', { tripId: id, source: 'personalized_recommendation' });
  }, [track]);

  const handleSaveInteraction = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev?.filter((item) => item.id !== id));
    track('recommendation_saved', { destinationId: id, source: 'personalized_recommendation' });
    refreshRecommendations(true);
  }, [track, refreshRecommendations]);

  const handleIgnoreInteraction = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev?.filter((item) => item.id !== id));
    track('recommendation_ignored', { destinationId: id, source: 'personalized_recommendation' });
    refreshRecommendations(true);
  }, [track, refreshRecommendations]);

  const handleDislikeInteraction = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev?.filter((item) => item.id !== id));
    track('recommendation_disliked', { destinationId: id, source: 'personalized_recommendation' });
    refreshRecommendations(true);
  }, [track, refreshRecommendations]);

  return (
    <section
      className="rounded-xl border shadow-sm overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg leading-tight">{title}</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              AI-powered suggestions tailored per user behaviour
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
        ) : error || items === undefined ? (
          <UnavailableState onRetry={() => refreshRecommendations(false)} />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item) => (
            <RecommendationCard
              key={item.id}
              item={item}
              onTrack={handleTrackInteraction}
              onSave={handleSaveInteraction}
              onIgnore={handleIgnoreInteraction}
              onDislike={handleDislikeInteraction}
            />
          ))
        )}
      </div>
    </section>
  );
}

