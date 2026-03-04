import { useQuery } from "@tanstack/react-query";

import api from "../services/api";
import { API_ENDPOINTS, CACHE_TTL } from "../constants/config";
import { StoryDetail } from "../types/story";

export function useStory(storyId: number) {
  const query = useQuery<StoryDetail>({
    queryKey: ["story", storyId],
    queryFn: async () => {
      const response = await api.get<StoryDetail>(API_ENDPOINTS.story(storyId));
      return response.data;
    },
    staleTime: CACHE_TTL.story,
    enabled: !!storyId,
  });

  return {
    story: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
