import { useState, useEffect, useCallback } from 'react';
import { callAuthenticatedApi } from '../api/apiClient';
import { handleApiError, ErrorType } from '../utils/errorHandler';

interface UseFetchOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  initialData?: T;
  dependencies?: any[];
  autoFetch?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  errorType: ErrorType | null;
  fetch: (body?: any) => Promise<T>;
  reset: () => void;
}

/**
 * Hook for fetching data with built-in loading, error, and retry handling
 */
export function useFetch<T = any>({
  url,
  method = 'GET',
  body,
  headers,
  initialData = null,
  dependencies = [],
  autoFetch = true,
  onSuccess,
  onError
}: UseFetchOptions<T>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);

  const fetchData = useCallback(async (overrideBody?: any) => {
    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const responseData = await callAuthenticatedApi<T>(
        url,
        method,
        overrideBody || body,
        headers
      );
      
      setData(responseData);
      onSuccess?.(responseData);
      return responseData;
    } catch (err: any) {
      const handledError = handleApiError(err, { showToast: true });
      const error = new Error(handledError.message);
      
      setError(error);
      setErrorType(handledError.type);
      onError?.(error);
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [url, method, body, headers, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setErrorType(null);
  }, [initialData]);

  // Run the fetch automatically if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchData().catch(() => {
        // Error is already handled by the fetchData function
      });
    }
  }, [fetchData, autoFetch, ...dependencies]);

  return { data, loading, error, errorType, fetch: fetchData, reset };
}

export default useFetch; 