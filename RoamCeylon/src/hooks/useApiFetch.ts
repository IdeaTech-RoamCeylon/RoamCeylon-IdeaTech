import { useState, useEffect, useCallback } from 'react';
import { showToast } from '../utils/toast';

interface UseApiFetchOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  errorMessage?: string;
  autoFetch?: boolean;
}

interface UseApiFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for handling API fetch operations with loading, error states, and toast notifications
 * 
 * @param fetchFn - Async function that returns data from API
 * @param options - Configuration options for toasts and auto-fetch
 * @returns Object containing data, loading, error states and refetch function
 * 
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useApiFetch(
 *   () => marketplaceApi.getCategories(),
 *   { showErrorToast: true }
 * );
 * ```
 */
export function useApiFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseApiFetchOptions = {}
): UseApiFetchReturn<T> {
  const {
    showSuccessToast = false,
    successMessage = 'Success',
    showErrorToast = true,
    errorMessage,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      
      if (showSuccessToast) {
        showToast.success(successMessage, 'Success');
      }
    } catch (err: any) {
      const errorMsg = errorMessage || 'Failed to load data. Please try again.';
      setError(errorMsg);
      
      if (showErrorToast) {
        showToast.apiError(err, errorMsg);
      }
      
      console.error('API fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, showSuccessToast, successMessage, showErrorToast, errorMessage]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
