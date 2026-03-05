"use client";

import { useState, useCallback, useRef } from "react";
import { startDebate, debateRoundUrl, updateDebateStatus, postInterjection } from "@/lib/api";
import { streamSSE } from "@/lib/sse";
import type { Perspective } from "@/types/chat";
import type {
  DebateDetail,
  DebateSSEEvent,
  DebateStatus,
  DebateTurnData,
  InterjectionCreate,
} from "@/types/debate";

interface DebateState {
  debate: DebateDetail | null;
  streamingRole: string | null;
  streamingText: string;
  streaming: boolean;
  roundComplete: boolean;
  error: string | null;
}

/** Yield control to the browser so React can paint. */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

export function useDebate(storyId: number) {
  const [state, setState] = useState<DebateState>({
    debate: null,
    streamingRole: null,
    streamingText: "",
    streaming: false,
    roundComplete: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (personas: Perspective[]) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const debate = await startDebate(storyId, { personas });
      setState((s) => ({ ...s, debate: { ...debate, turns: debate.turns ?? [] } }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : String(err) }));
    }
  }, [storyId]);

  const runRound = useCallback(async () => {
    if (!state.debate) return;
    setState((s) => ({ ...s, streaming: true, streamingText: "", streamingRole: null, roundComplete: false, error: null }));
    abortRef.current = new AbortController();

    const accTurns: DebateTurnData[] = [];
    let currentRole: string | null = null;
    let currentText = "";

    // Queue + processor: SSE events arrive synchronously in onEvent, but we
    // need async pauses (between turns) so React can paint the completed turn
    // before the next one starts streaming.
    const queue: DebateSSEEvent[] = [];
    let processing = false;

    async function processQueue() {
      if (processing) return;
      processing = true;

      while (queue.length > 0) {
        const ev = queue.shift()!;

        if (ev.type === "turn_start") {
          currentRole = ev.role;
          currentText = "";
          setState((s) => ({ ...s, streamingRole: ev.role, streamingText: "" }));
        } else if (ev.type === "token") {
          currentText += ev.text;
          setState((s) => ({ ...s, streamingText: s.streamingText + ev.text }));
        } else if (ev.type === "turn_complete") {
          const turn: DebateTurnData = {
            id: Number(ev.turn_id),
            turn_number: accTurns.length + 1,
            role: ev.role,
            content: currentText,
            summary: null,
            citations: null,
            round_number: state.debate?.current_round ?? 1,
            created_at: new Date().toISOString(),
          };
          accTurns.push(turn);
          setState((s) => ({
            ...s,
            debate: s.debate ? { ...s.debate, turns: [...s.debate.turns, turn] } : s.debate,
            streamingText: "",
          }));
          // Let React paint the completed turn before processing the next turn_start
          await tick();
        } else if (ev.type === "round_complete") {
          setState((s) => ({
            ...s,
            streaming: false,
            roundComplete: true,
            debate: s.debate ? { ...s.debate, current_round: ev.round_number + 1 } : s.debate,
          }));
        } else if (ev.type === "ended") {
          setState((s) => ({ ...s, streaming: false, error: ev.message }));
        } else if (ev.type === "error") {
          setState((s) => ({ ...s, streaming: false, error: ev.message }));
        }
      }

      processing = false;
    }

    await streamSSE<DebateSSEEvent>({
      url: debateRoundUrl(state.debate.id),
      body: {},
      signal: abortRef.current.signal,
      onEvent(ev) {
        queue.push(ev);
        processQueue();
      },
      onError(err) {
        setState((s) => ({ ...s, streaming: false, error: err.message }));
      },
    });
  }, [state.debate]);

  const interject = useCallback(async (body: InterjectionCreate) => {
    if (!state.debate) return;
    try {
      const turn = await postInterjection(state.debate.id, body);
      const turnData: DebateTurnData = {
        id: turn.turn_id,
        turn_number: turn.turn_number,
        role: "moderator",
        content: turn.content,
        summary: null,
        citations: null,
        round_number: state.debate.current_round,
        created_at: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        debate: s.debate ? { ...s.debate, turns: [...s.debate.turns, turnData] } : s.debate,
      }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : String(err) }));
    }
  }, [state.debate]);

  const setStatus = useCallback(async (status: "paused" | "completed") => {
    if (!state.debate) return;
    try {
      const updated = await updateDebateStatus(state.debate.id, status);
      setState((s) => ({ ...s, debate: { ...updated, turns: updated.turns ?? s.debate?.turns ?? [] } }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : String(err) }));
    }
  }, [state.debate]);

  const loadDebate = useCallback((detail: DebateDetail) => {
    setState({
      debate: { ...detail, turns: detail.turns ?? [] },
      streamingRole: null,
      streamingText: "",
      streaming: false,
      roundComplete: detail.turns?.length > 0,
      error: null,
    });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      debate: null,
      streamingRole: null,
      streamingText: "",
      streaming: false,
      roundComplete: false,
      error: null,
    });
  }, []);

  return { ...state, start, runRound, interject, setStatus, loadDebate, reset };
}
