import EventSource from "react-native-sse";

import { API_BASE_URL, API_ENDPOINTS } from "../constants/config";
import api from "./api";
import type {
  ChatRequest,
  ChatStreamEvent,
  ConversationSummary,
  Conversation,
  PerspectiveAvailability,
} from "../types/chat";

export async function getPerspectives(
  storyId: string
): Promise<PerspectiveAvailability> {
  const response = await api.get(API_ENDPOINTS.chatPerspectives(storyId));
  return response.data;
}

export async function getConversations(
  storyId: string
): Promise<{ conversations: ConversationSummary[] }> {
  const response = await api.get(API_ENDPOINTS.chatConversations(storyId));
  return response.data;
}

export async function getConversation(
  conversationId: string
): Promise<Conversation> {
  const response = await api.get(API_ENDPOINTS.chatConversation(conversationId));
  return response.data;
}

export async function deleteConversation(
  conversationId: string
): Promise<void> {
  await api.delete(API_ENDPOINTS.chatConversation(conversationId));
}

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onCitation: (citations: ChatStreamEvent & { type: "citation" }) => void;
  onDone: (messageId: string) => void;
  onError: (error: { code: string; message: string }) => void;
  onConversationStart: (conversationId: string) => void;
  onEnded: (reason: string, message: string) => void;
}

export function streamChat(
  storyId: string,
  request: ChatRequest,
  callbacks: StreamCallbacks
): { close: () => void } {
  const url = `${API_BASE_URL}${API_ENDPOINTS.chatStream(storyId)}`;

  // Use POST via fetch for SSE since EventSource only supports GET
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        callbacks.onError({
          code: String(response.status),
          message: errorData.detail || response.statusText,
        });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError({ code: "no_reader", message: "No response body" });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const event = JSON.parse(data) as ChatStreamEvent;
              switch (event.type) {
                case "token":
                  callbacks.onToken(event.text);
                  break;
                case "citation":
                  callbacks.onCitation(event);
                  break;
                case "done":
                  callbacks.onDone(event.message_id);
                  break;
                case "error":
                  callbacks.onError({
                    code: event.code,
                    message: event.message,
                  });
                  break;
                case "conversation_start":
                  callbacks.onConversationStart(event.conversation_id);
                  break;
                case "ended":
                  callbacks.onEnded(event.reason, event.message);
                  break;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      callbacks.onError({
        code: "connection_error",
        message: error instanceof Error ? error.message : "Connection failed",
      });
    }
  })();

  return {
    close: () => controller.abort(),
  };
}
