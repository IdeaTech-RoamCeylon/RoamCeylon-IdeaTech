import { useCallback, useRef } from 'react';

export interface UseInfiniteScrollOptions {
  threshold?: number; // How close to end before loading (0-1, default: 0.5)
  enabled?: boolean; // Whether infinite scroll is enabled
  onLoadMore: () => void | Promise<void>;
  isLoading?: boolean; // Prevent multiple simultaneous loads
}

export interface UseInfiniteScrollReturn {
  onEndReached: () => void;
  onEndReachedThreshold: number;
}

/**
 * Hook for implementing infinite scroll behavior with FlatList
 * 
 * @example
 * const { onEndReached, onEndReachedThreshold } = useInfiniteScroll({
 *   threshold: 0.5,
 *   enabled: hasMore && !isLoading,
 *   onLoadMore: loadMore,
 *   isLoading: isLoadingMore,
 * });
 * 
 * <FlatList
 *   onEndReached={onEndReached}
 *   onEndReachedThreshold={onEndReachedThreshold}
 *   // ... other props
 * />
 */
export function useInfiniteScroll({
  threshold = 0.5,
  enabled = true,
  onLoadMore,
  isLoading = false,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  // Track last call time to debounce rapid scroll events
  const lastCallTimeRef = useRef<number>(0);
  const DEBOUNCE_MS = 500;

  const onEndReached = useCallback(() => {
    // Don't load if disabled, already loading, or called too recently
    if (!enabled || isLoading) {
      return;
    }

    const now = Date.now();
    if (now - lastCallTimeRef.current < DEBOUNCE_MS) {
      return;
    }

    lastCallTimeRef.current = now;
    onLoadMore();
  }, [enabled, isLoading, onLoadMore]);

  return {
    onEndReached,
    onEndReachedThreshold: threshold,
  };
}
