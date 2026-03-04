import { useCallback, useEffect, useState } from "react";

import type { Perspective } from "../types/chat";
import type { DebateStatus } from "../types/debate";
import {
  getAllDebates,
  cleanExpiredDebates,
  deleteDebate as deleteDebateLocal,
} from "../services/debateStorage";

export interface DebateHistoryItem {
  id: string;
  story_id: string;
  story_headline: string;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
  turn_count: number;
  updated_at: string;
  last_turn_preview: string | null;
}

interface UseDebateHistoryReturn {
  debates: DebateHistoryItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  deleteDebate: (debateId: string) => Promise<void>;
}

export function useDebateHistory(): UseDebateHistoryReturn {
  const [debates, setDebates] = useState<DebateHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDebates = useCallback(async () => {
    try {
      setIsLoading(true);
      await cleanExpiredDebates();
      const results = await getAllDebates();
      setDebates(results);
    } catch (err) {
      console.error("Failed to load debate history:", err);
      setDebates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDebates();
  }, [loadDebates]);

  const deleteDebate = useCallback(async (debateId: string) => {
    await deleteDebateLocal(debateId);
    setDebates((prev) => prev.filter((d) => d.id !== debateId));
  }, []);

  return {
    debates,
    isLoading,
    refresh: loadDebates,
    deleteDebate,
  };
}
