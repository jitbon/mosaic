"use client";

import { useState, useEffect } from "react";
import { getStory } from "@/lib/api";
import type { StoryDetail } from "@/types/story";

export function useStory(id: number) {
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStory(id)
      .then(setStory)
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [id]);

  return { story, loading, error };
}
