"use client";

import { useState, useCallback } from "react";
import { getFeed } from "@/lib/api";
import type { FeedFilter, FeedStory } from "@/types/feed";

export function useFeed() {
  const [stories, setStories] = useState<FeedStory[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (f: FeedFilter, o: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getFeed(f, o);
        setStories((prev) => (append ? [...prev, ...res.stories] : res.stories));
        setHasMore(res.pagination.has_more);
        setOffset(o + res.stories.length);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const changeFilter = useCallback(
    (f: FeedFilter) => {
      setFilter(f);
      setOffset(0);
      setStories([]);
      load(f, 0, false);
    },
    [load]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) load(filter, offset, true);
  }, [loading, hasMore, load, filter, offset]);

  const refresh = useCallback(() => {
    load(filter, 0, false);
  }, [load, filter]);

  return { stories, filter, loading, error, hasMore, changeFilter, loadMore, refresh };
}
