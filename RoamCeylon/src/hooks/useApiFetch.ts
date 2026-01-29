import { useState, useEffect, useCallback, useRef } from 'react';
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
  const hasFetchedRef = useRef(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      
      if (isMounted.current) {
        setData(result);
        
        if (showSuccessToast) {
          showToast.success(successMessage, 'Success');
        }
      }
    } catch (err: any) {
      if (isMounted.current) {
        const errorMsg = errorMessage || 'Failed to load data. Please try again.';
        setError(errorMsg);
        
        if (showErrorToast) {
          showToast.apiError(err, errorMsg);
        }
      }
      
      console.error('API fetch error:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [showSuccessToast, successMessage, showErrorToast, errorMessage]);

  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setLoading(true);
      
      fetchFn().then(result => {
        if (isMounted.current) {
          setData(result);
          if (showSuccessToast) {
            showToast.success(successMessage, 'Success');
          }
        }
      }).catch(err => {
        if (isMounted.current) {
          const errorMsg = errorMessage || 'Failed to load data. Please try again.';
          setError(errorMsg);
          if (showErrorToast) {
            showToast.apiError(err, errorMsg);
          }
        }
        console.error('API fetch error:', err);
      }).finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
    }
  }, [autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
