import { useCallback, useEffect, useState } from "react";

import {
  deleteConversation,
  getAllConversations,
} from "../services/chatStorage";
import type { Perspective } from "../types/chat";

export interface ChatHistoryItem {
  id: string;
  story_id: string;
  perspective: Perspective;
  story_headline: string;
  message_count: number;
  is_ended: boolean;
  updated_at: string;
}

export interface GroupedChatHistory {
  story_id: string;
  story_headline: string;
  conversations: ChatHistoryItem[];
  latest_updated_at: string;
}

export function useChatHistory() {
  const [conversations, setConversations] = useState<ChatHistoryItem[]>([]);
  const [grouped, setGrouped] = useState<GroupedChatHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllConversations();
      setConversations(all);

      // Group by story
      const map = new Map<string, GroupedChatHistory>();
      for (const conv of all) {
        const existing = map.get(conv.story_id);
        if (existing) {
          existing.conversations.push(conv);
          if (conv.updated_at > existing.latest_updated_at) {
            existing.latest_updated_at = conv.updated_at;
          }
        } else {
          map.set(conv.story_id, {
            story_id: conv.story_id,
            story_headline: conv.story_headline || "Story",
            conversations: [conv],
            latest_updated_at: conv.updated_at,
          });
        }
      }

      const groups = Array.from(map.values()).sort(
        (a, b) => b.latest_updated_at.localeCompare(a.latest_updated_at)
      );
      setGrouped(groups);
    } catch {
      // Silently fail - empty state is fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(
    async (conversationId: string) => {
      await deleteConversation(conversationId);
      await load();
    },
    [load]
  );

  return { conversations, grouped, loading, refresh: load, remove };
}
