import { useCallback } from "react";
import { cacheGet, cacheSet } from "../services/cache";

export function useOfflineCache<T>(key: string, ttlMs: number) {
  const getCached = useCallback(async (): Promise<T | null> => {
    return cacheGet<T>(key);
  }, [key]);

  const setCached = useCallback(
    async (data: T): Promise<void> => {
      await cacheSet(key, data, ttlMs);
    },
    [key, ttlMs]
  );

  return { getCached, setCached };
}
