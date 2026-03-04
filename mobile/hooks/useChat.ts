import { useCallback, useRef, useState } from "react";

import { streamChat } from "../services/chatApi";
import {
  getConversation,
  saveConversation,
  saveMessage,
  markConversationEnded,
} from "../services/chatStorage";
import type {
  Citation,
  Conversation,
  Message,
  Perspective,
} from "../types/chat";

interface UseChatState {
  messages: Message[];
  streamingText: string;
  isStreaming: boolean;
  error: string | null;
  conversationId: string | null;
  isEnded: boolean;
}

interface UseChatReturn extends UseChatState {
  sendMessage: (text: string) => void;
  stopStream: () => void;
  loadConversation: (storyId: string, perspective: Perspective) => Promise<void>;
}

export function useChat(
  storyId: string,
  perspective: Perspective,
  storyHeadline: string
): UseChatReturn {
  const [state, setState] = useState<UseChatState>({
    messages: [],
    streamingText: "",
    isStreaming: false,
    error: null,
    conversationId: null,
    isEnded: false,
  });

  const streamRef = useRef<{ close: () => void } | null>(null);
  const bufferRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const citationsRef = useRef<Citation[]>([]);

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length > 0) {
      const chunk = bufferRef.current.join("");
      bufferRef.current = [];
      setState((prev) => ({
        ...prev,
        streamingText: prev.streamingText + chunk,
      }));
    }
    rafRef.current = requestAnimationFrame(flushBuffer);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.close();
    streamRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const loadConversation = useCallback(
    async (sid: string, persp: Perspective) => {
      // Stop any active stream when switching perspectives
      stopStream();

      const conv = await getConversation(sid, persp);
      if (conv) {
        setState({
          messages: conv.messages,
          streamingText: "",
          isStreaming: false,
          conversationId: conv.id,
          isEnded: conv.is_ended,
          error: null,
        });
      } else {
        // Reset to empty state for new perspective
        setState({
          messages: [],
          streamingText: "",
          isStreaming: false,
          conversationId: null,
          isEnded: false,
          error: null,
        });
      }
    },
    [stopStream]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (state.isStreaming || state.isEnded) return;

      // Add user message immediately
      const userMessage: Message = {
        id: `local_${Date.now()}`,
        role: "user",
        content: text,
        citations: null,
        created_at: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        streamingText: "",
        isStreaming: true,
        error: null,
      }));

      bufferRef.current = [];
      citationsRef.current = [];
      rafRef.current = requestAnimationFrame(flushBuffer);

      let currentConversationId = state.conversationId;

      const stream = streamChat(
        storyId,
        {
          message: text,
          perspective,
          conversation_id: currentConversationId,
        },
        {
          onToken: (tokenText) => {
            bufferRef.current.push(tokenText);
          },
          onCitation: (event) => {
            if (event.type === "citation") {
              citationsRef.current = event.citations;
            }
          },
          onConversationStart: async (convId) => {
            currentConversationId = convId;
            setState((prev) => ({ ...prev, conversationId: convId }));
            await saveConversation({
              id: convId,
              story_id: storyId,
              perspective,
              story_headline: storyHeadline,
            });
          },
          onDone: async (messageId) => {
            stopStream();

            // Flush any remaining buffer
            const remaining = bufferRef.current.join("");
            bufferRef.current = [];

            setState((prev) => {
              const fullText = prev.streamingText + remaining;
              const assistantMessage: Message = {
                id: messageId,
                role: "assistant",
                content: fullText,
                citations: citationsRef.current.length
                  ? citationsRef.current
                  : null,
                created_at: new Date().toISOString(),
              };

              // Save to local storage
              if (currentConversationId) {
                saveMessage(userMessage, currentConversationId);
                saveMessage(assistantMessage, currentConversationId);
              }

              return {
                ...prev,
                messages: [...prev.messages, assistantMessage],
                streamingText: "",
                isStreaming: false,
              };
            });
          },
          onError: (err) => {
            stopStream();
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              streamingText: "",
              error: err.message,
            }));
          },
          onEnded: async (reason, message) => {
            stopStream();
            if (currentConversationId) {
              await markConversationEnded(currentConversationId);
            }
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              streamingText: "",
              isEnded: true,
              error: message,
            }));
          },
        }
      );

      streamRef.current = stream;
    },
    [
      state.isStreaming,
      state.isEnded,
      state.conversationId,
      storyId,
      perspective,
      storyHeadline,
      flushBuffer,
      stopStream,
    ]
  );

  return {
    ...state,
    sendMessage,
    stopStream,
    loadConversation,
  };
}
