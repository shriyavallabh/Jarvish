import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { toast } from 'sonner';

// Generic API hook for any endpoint
export function useApi<T = any>(
  url: string,
  options?: UseQueryOptions<T>
) {
  return useQuery<T>({
    queryKey: [url],
    queryFn: async () => {
      const response = await api.get<T>(url);
      return response as T;
    },
    ...options,
  });
}

// Hook for mutations (POST, PUT, PATCH, DELETE)
export function useApiMutation<TData = any, TVariables = any>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string | ((variables: TVariables) => string),
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const endpoint = typeof url === 'function' ? url(variables) : url;
      
      switch (method) {
        case 'post':
          return api.post<TData>(endpoint, variables);
        case 'put':
          return api.put<TData>(endpoint, variables);
        case 'patch':
          return api.patch<TData>(endpoint, variables);
        case 'delete':
          return api.delete<TData>(endpoint);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
    ...options,
  });
}

// Debounced API call hook (useful for search, compliance checks, etc.)
export function useDebouncedApi<T = any>(
  url: string,
  params: any,
  delay: number = 500,
  enabled: boolean = true
) {
  const [debouncedParams, setDebouncedParams] = useState(params);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedParams(params);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [params, delay]);
  
  return useQuery<T>({
    queryKey: [url, debouncedParams],
    queryFn: async () => {
      const queryParams = new URLSearchParams(debouncedParams).toString();
      const response = await api.get<T>(`${url}?${queryParams}`);
      return response as T;
    },
    enabled: enabled && !!debouncedParams,
  });
}

// Infinite scroll hook for paginated data
export function useInfiniteApi<T = any>(
  baseUrl: string,
  limit: number = 10
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get<any>(
        `${baseUrl}?page=${page}&limit=${limit}`
      );
      
      const newItems = response.data || [];
      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length === limit);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(handleApiError(err));
      toast.error('Failed to load more items');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, page, limit, isLoading, hasMore]);
  
  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);
  
  return {
    items,
    loadMore,
    reset,
    isLoading,
    hasMore,
    error,
  };
}

// Real-time data hook (polling)
export function useRealtimeApi<T = any>(
  url: string,
  interval: number = 5000,
  enabled: boolean = true
) {
  return useQuery<T>({
    queryKey: [url, 'realtime'],
    queryFn: async () => {
      const response = await api.get<T>(url);
      return response as T;
    },
    refetchInterval: enabled ? interval : false,
    enabled,
  });
}

// File upload hook
export function useFileUpload(
  url: string,
  onSuccess?: (data: any) => void,
  onError?: (error: Error) => void
) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const upload = useCallback(async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });
      
      toast.success('File uploaded successfully');
      onSuccess?.(response);
      return response;
    } catch (error) {
      const err = new Error(handleApiError(error));
      toast.error('File upload failed');
      onError?.(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [url, onSuccess, onError]);
  
  return {
    upload,
    isUploading,
    progress,
  };
}