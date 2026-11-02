"use client";

import { useCallback, useEffect, useState } from "react";

export function useAsyncResource<T>(loader: () => Promise<{ success?: boolean; data?: T }>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await loader();
      if (res?.success === false) {
        setError("Request failed");
        setData(null);
        return;
      }
      setData((res?.data ?? null) as T | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}
