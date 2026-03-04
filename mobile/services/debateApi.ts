import { API_BASE_URL, API_ENDPOINTS } from "../constants/config";
import api from "./api";
import type {
  Debate,
  DebateCreateRequest,
  DebateDetail,
  DebateListItem,
  DebateStreamEvent,
  InterjectionRequest,
  InterjectionResponse,
} from "../types/debate";

export async function startDebate(
  storyId: string,
  request: DebateCreateRequest,
): Promise<Debate> {
  const response = await api.post(API_ENDPOINTS.debateStart(storyId), request);
  return response.data;
}

export async function submitInterjection(
  debateId: string,
  request: InterjectionRequest,
): Promise<InterjectionResponse> {
  const response = await api.post(
    API_ENDPOINTS.debateInterject(debateId),
    request,
  );
  return response.data;
}

export async function listDebates(
  storyId: string,
): Promise<{ debates: DebateListItem[] }> {
  const response = await api.get(API_ENDPOINTS.debateList(storyId));
  return response.data;
}

export async function getDebate(debateId: string): Promise<DebateDetail> {
  const response = await api.get(API_ENDPOINTS.debateDetail(debateId));
  return response.data;
}

export async function updateDebateStatus(
  debateId: string,
  status: "paused" | "completed",
): Promise<{ id: number; status: string }> {
  const response = await api.patch(
    `${API_ENDPOINTS.debateStatus(debateId)}?status=${status}`,
  );
  return response.data;
}

export async function deleteDebate(debateId: string): Promise<void> {
  await api.delete(API_ENDPOINTS.debateDetail(debateId));
}

// --- SSE streaming ---

export interface DebateStreamCallbacks {
  onRoundStart: (roundNumber: number) => void;
  onTurnStart: (role: string, turnNumber: number) => void;
  onToken: (text: string) => void;
  onCitation: (citations: DebateStreamEvent & { type: "citation" }) => void;
  onTurnSummary: (turnId: string, summary: string) => void;
  onTurnComplete: (turnId: string, role: string) => void;
  onRoundComplete: (roundNumber: number, debateId: string) => void;
  onError: (error: { code: string; message: string }) => void;
  onEnded: (reason: string, message: string) => void;
}

export function streamRound(
  debateId: string,
  callbacks: DebateStreamCallbacks,
): { close: () => void } {
  const url = `${API_BASE_URL}${API_ENDPOINTS.debateRound(debateId)}`;
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: "{}",
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
              const event = JSON.parse(data) as DebateStreamEvent;
              switch (event.type) {
                case "round_start":
                  callbacks.onRoundStart(event.round_number);
                  break;
                case "turn_start":
                  callbacks.onTurnStart(event.role, event.turn_number);
                  break;
                case "token":
                  callbacks.onToken(event.text);
                  break;
                case "citation":
                  callbacks.onCitation(event);
                  break;
                case "turn_summary":
                  callbacks.onTurnSummary(event.turn_id, event.summary);
                  break;
                case "turn_complete":
                  callbacks.onTurnComplete(event.turn_id, event.role);
                  break;
                case "round_complete":
                  callbacks.onRoundComplete(
                    event.round_number,
                    event.debate_id,
                  );
                  break;
                case "error":
                  callbacks.onError({
                    code: event.code,
                    message: event.message,
                  });
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
