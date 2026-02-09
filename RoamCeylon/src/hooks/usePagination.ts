import { useState, useCallback, useRef } from 'react';

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  total?: number;
}

export interface UsePaginationOptions<T> {
  fetchFunction: (page: number, pageSize: number) => Promise<{
    data: T[];
    hasMore: boolean;
    total?: number;
  }>;
  pageSize?: number;
  initialData?: T[];
  onError?: (error: Error) => void;
}

export interface UsePaginationReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  error: string | null;
  currentPage: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

export function usePagination<T>({
  fetchFunction,
  pageSize = 10,
  initialData = [],
  onError,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Track if initial load has happened
  const hasLoadedRef = useRef(false);
  // Prevent duplicate requests
  const isLoadingRef = useRef(false);

  const loadPage = useCallback(async (
    page: number,
    isRefresh: boolean = false
  ) => {
    // Prevent duplicate requests
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setError(null);

    // Set appropriate loading state
    if (isRefresh) {
      setIsRefreshing(true);
    } else if (page === 1 && !hasLoadedRef.current) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await fetchFunction(page, pageSize);
      
      if (isRefresh || page === 1) {
        // Replace data on refresh or first page
        setData(result.data);
      } else {
        // Append data for subsequent pages
        setData(prev => [...prev, ...result.data]);
      }

      setHasMore(result.hasMore);
      setCurrentPage(page);
      hasLoadedRef.current = true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
      isLoadingRef.current = false;
    }
  }, [fetchFunction, pageSize, onError]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) {
      return;
    }

    await loadPage(currentPage + 1, false);
  }, [hasMore, currentPage, loadPage]);

  const refresh = useCallback(async () => {
    setHasMore(true);
    await loadPage(1, true);
  }, [loadPage]);

  const retry = useCallback(async () => {
    await loadPage(currentPage, false);
  }, [currentPage, loadPage]);

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setIsLoadingMore(false);
    setIsRefreshing(false);
    setHasMore(true);
    setError(null);
    setCurrentPage(1);
    hasLoadedRef.current = false;
    isLoadingRef.current = false;
  }, [initialData]);

  return {
    data,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    error,
    currentPage,
    loadMore,
    refresh,
    retry,
    reset,
  };
}
