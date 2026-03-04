import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import api from "../services/api";
import { cacheGet, cacheSet } from "../services/cache";
import { API_ENDPOINTS, CACHE_TTL, FEED_PAGE_SIZE } from "../constants/config";
import { FeedResponse, FeedFilter } from "../types/feed";
import { Story } from "../types/story";

export function useFeed(filter: FeedFilter = "all") {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<FeedResponse>({
    queryKey: ["feed", filter],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.get<FeedResponse>(API_ENDPOINTS.feed, {
        params: {
          limit: FEED_PAGE_SIZE,
          offset: pageParam,
          filter,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_more) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: CACHE_TTL.feed,
  });

  // Cache feed data for offline use
  useEffect(() => {
    if (query.data?.pages) {
      const allStories = query.data.pages.flatMap((p) => p.stories);
      cacheSet(`feed:${filter}`, allStories, CACHE_TTL.feed);
    }
  }, [query.data, filter]);

  // Load from offline cache on initial mount
  useEffect(() => {
    if (!query.data && !query.isLoading) {
      cacheGet<Story[]>(`feed:${filter}`).then((cached) => {
        if (cached) {
          queryClient.setQueryData(["feed", filter], {
            pages: [
              {
                stories: cached,
                pagination: {
                  total: cached.length,
                  limit: FEED_PAGE_SIZE,
                  offset: 0,
                  has_more: false,
                },
              },
            ],
            pageParams: [0],
          });
        }
      });
    }
  }, []);

  const allStories = query.data?.pages.flatMap((p) => p.stories) ?? [];

  const refresh = useCallback(async () => {
    try {
      await api.post(API_ENDPOINTS.refresh);
    } catch {
      // Refresh endpoint may fail, still refetch feed
    }
    await query.refetch();
  }, [query]);

  return {
    stories: allStories,
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    error: query.error,
    refresh,
    loadMore: query.fetchNextPage,
    hasMore: query.hasNextPage ?? false,
  };
}
