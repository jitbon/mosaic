"use client";

import { useState, useCallback, useRef } from "react";
import { chatStreamUrl } from "@/lib/api";
import { streamSSE } from "@/lib/sse";
import type { ChatSSEEvent, Citation, Message, Perspective } from "@/types/chat";

interface ChatState {
  messages: Message[];
  streaming: boolean;
  streamingText: string;
  streamingCitations: Citation[];
  conversationId: number | null;
  ended: boolean;
  endedReason: string | null;
  error: string | null;
}

export function useChat(storyId: number) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    streaming: false,
    streamingText: "",
    streamingCitations: [],
    conversationId: null,
    ended: false,
    endedReason: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string, perspective: Perspective) => {
      if (state.streaming) return;

      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        content: text,
        citations: null,
        created_at: new Date().toISOString(),
      };

      setState((s) => ({
        ...s,
        messages: [...s.messages, userMsg],
        streaming: true,
        streamingText: "",
        streamingCitations: [],
        error: null,
      }));

      abortRef.current = new AbortController();
      let localConvId = state.conversationId;
      let finalText = "";
      let finalCitations: Citation[] = [];

      await streamSSE<ChatSSEEvent>({
        url: chatStreamUrl(storyId),
        body: { message: text, perspective, conversation_id: localConvId ?? undefined },
        signal: abortRef.current.signal,
        onEvent(ev) {
          if (ev.type === "conversation_start") {
            localConvId = ev.conversation_id;
            setState((s) => ({ ...s, conversationId: ev.conversation_id }));
          } else if (ev.type === "token") {
            finalText += ev.text;
            setState((s) => ({ ...s, streamingText: s.streamingText + ev.text }));
          } else if (ev.type === "citation") {
            finalCitations = ev.citations;
            setState((s) => ({ ...s, streamingCitations: ev.citations }));
          } else if (ev.type === "done") {
            const assistantMsg: Message = {
              id: ev.message_id,
              role: "assistant",
              content: finalText,
              citations: finalCitations.length > 0 ? finalCitations : null,
              created_at: new Date().toISOString(),
            };
            setState((s) => ({
              ...s,
              messages: [...s.messages, assistantMsg],
              streaming: false,
              streamingText: "",
              streamingCitations: [],
            }));
          } else if (ev.type === "ended") {
            setState((s) => ({ ...s, ended: true, endedReason: ev.message, streaming: false }));
          } else if (ev.type === "error") {
            setState((s) => ({ ...s, error: ev.message, streaming: false }));
          }
        },
        onError(err) {
          setState((s) => ({ ...s, error: err.message, streaming: false }));
        },
      });
    },
    [storyId, state.streaming, state.conversationId]
  );

  const loadConversation = useCallback((messages: Message[], id: number) => {
    setState((s) => ({ ...s, messages, conversationId: id }));
  }, []);

  return { ...state, sendMessage, loadConversation };
}
