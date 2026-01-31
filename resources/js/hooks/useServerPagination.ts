import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
// Minimal pagination response shape compatible with various API modules
export interface BasicPaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page?: number;
    [key: string]: unknown;
  };
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface UseServerPaginationOptions<P extends PaginationParams> {
  initialParams?: P;
  immediate?: boolean;
}

export interface UseServerPaginationResult<T, P extends PaginationParams> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  error: unknown;
  params: P;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (updater: (prev: P) => P) => void;
  refetch: () => void;
}

/**
 * Generic server-side pagination hook
 * Pass a `fetcher` that accepts params and returns PaginatedResponse<T>
 */
export function useServerPagination<T, P extends PaginationParams = PaginationParams>(
  fetcher: (params: P) => Promise<BasicPaginatedResponse<T>>,
  options: UseServerPaginationOptions<P> = {},
): UseServerPaginationResult<T, P> {
  const { initialParams, immediate = true } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState<number>(initialParams?.page ?? 1);
  const [pageSize, setPageSize] = useState<number>(initialParams?.per_page ?? 20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [params, setParams] = useState<P>({ ...(initialParams as P), page, per_page: pageSize } as P);

  // Defer params updates to avoid thrashing
  const deferredParams = useDeferredValue(params);

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher({ ...(deferredParams as P), page, per_page: pageSize } as P);
      setItems(response.data ?? []);
      setTotal(response.meta?.total ?? response.data?.length ?? 0);
      // Sync pageSize in case backend adjusts per_page
      setPage(response.meta?.current_page ?? page);
      setPageSize(response.meta?.per_page ?? pageSize);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetcher, deferredParams, page, pageSize]);

  useEffect(() => {
    if (immediate) {
      doFetch();
    }
  }, [doFetch, immediate]);

  const setFilters = useCallback((updater: (prev: P) => P) => {
    startTransition(() => {
      setParams((prev) => {
        const next = updater(prev);
        // Reset to first page when filters change
        setPage(1);
        return next;
      });
    });
  }, []);

  const refetch = useCallback(() => {
    void doFetch();
  }, [doFetch]);

  return useMemo(
    () => ({ items, page, pageSize, total, loading, error, params, setPage, setPageSize, setFilters, refetch }),
    [items, page, pageSize, total, loading, error, params, setPage, setPageSize, setFilters, refetch],
  );
}
