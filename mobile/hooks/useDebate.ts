import { useCallback, useRef, useState } from "react";

import type { Perspective, Citation } from "../types/chat";
import type { Debate, DebateRole, DebateTurn } from "../types/debate";
import {
  startDebate as apiStartDebate,
  streamRound,
  submitInterjection as apiSubmitInterjection,
} from "../services/debateApi";
import {
  saveDebate as saveDebateLocal,
  saveTurn as saveTurnLocal,
  updateDebateRound,
  getDebateWithTurns,
} from "../services/debateStorage";

export interface DebateTurnState extends DebateTurn {
  isExpanded: boolean;
}

interface UseDebateReturn {
  debate: Debate | null;
  turns: DebateTurnState[];
  isStreaming: boolean;
  currentStreamingRole: DebateRole | null;
  streamingContent: string;
  roundComplete: boolean;
  error: string | null;
  startDebate: (
    storyId: string,
    personas: Perspective[],
    storyHeadline?: string,
  ) => Promise<void>;
  resumeDebate: (debateId: string) => Promise<void>;
  requestNextRound: () => void;
  submitInterjection: (
    message: string,
    directedAt: string | null,
  ) => Promise<void>;
  toggleTurnExpanded: (turnNumber: number) => void;
}

export function useDebate(): UseDebateReturn {
  const [debate, setDebate] = useState<Debate | null>(null);
  const [turns, setTurns] = useState<DebateTurnState[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingRole, setCurrentStreamingRole] =
    useState<DebateRole | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [roundComplete, setRoundComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<{ close: () => void } | null>(null);
  const currentTurnRef = useRef<{
    turnNumber: number;
    role: DebateRole;
    content: string;
    citations: Citation[] | null;
  } | null>(null);

  const storyHeadlineRef = useRef<string>("");

  const startDebate = useCallback(
    async (
      storyId: string,
      personas: Perspective[],
      storyHeadline?: string,
    ) => {
      try {
        setError(null);
        storyHeadlineRef.current = storyHeadline || "";
        const result = await apiStartDebate(storyId, { personas });
        setDebate(result);
        setTurns([]);
        setRoundComplete(false);

        // Persist locally
        await saveDebateLocal({
          id: String(result.id),
          story_id: storyId,
          story_headline: storyHeadline,
          personas,
          status: "active",
          current_round: 0,
        });

        // Auto-start first round
        startRound(String(result.id));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to start debate");
      }
    },
    [],
  );

  const resumeDebate = useCallback(async (debateId: string) => {
    try {
      setError(null);
      const local = await getDebateWithTurns(debateId);
      if (!local) {
        setError("Debate not found locally");
        return;
      }
      setDebate({
        id: local.id,
        story_id: local.story_id,
        personas: local.personas,
        status: local.status as Debate["status"],
        current_round: local.current_round,
        created_at: local.created_at,
        updated_at: local.updated_at,
      });
      setTurns(
        local.turns.map((t) => ({
          ...t,
          isExpanded: false,
        })),
      );
      setRoundComplete(true);
      storyHeadlineRef.current = local.story_headline;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resume debate");
    }
  }, []);

  const startRound = useCallback((debateId: string) => {
    setIsStreaming(true);
    setRoundComplete(false);
    setError(null);
    currentTurnRef.current = null;

    const stream = streamRound(debateId, {
      onRoundStart: () => {
        // Round started
      },
      onTurnStart: (role: string, turnNumber: number) => {
        // Collapse previous turns
        setTurns((prev) => prev.map((t) => ({ ...t, isExpanded: false })));
        setCurrentStreamingRole(role as DebateRole);
        setStreamingContent("");
        currentTurnRef.current = {
          turnNumber,
          role: role as DebateRole,
          content: "",
          citations: null,
        };
      },
      onToken: (text: string) => {
        setStreamingContent((prev) => prev + text);
        if (currentTurnRef.current) {
          currentTurnRef.current.content += text;
        }
      },
      onCitation: (event) => {
        if (currentTurnRef.current) {
          currentTurnRef.current.citations = event.citations;
        }
      },
      onTurnSummary: (turnId: string, summary: string) => {
        const current = currentTurnRef.current;
        if (!current) return;

        const completedTurn: DebateTurnState = {
          id: turnId,
          turn_number: current.turnNumber,
          role: current.role,
          content: current.content,
          summary,
          citations: current.citations,
          round_number: 0, // Updated on round_complete
          created_at: new Date().toISOString(),
          isExpanded: false,
        };

        setTurns((prev) => [...prev, completedTurn]);
        setStreamingContent("");
        setCurrentStreamingRole(null);
        currentTurnRef.current = null;

        // Persist turn locally
        saveTurnLocal(completedTurn, debateId).catch(() => {});
      },
      onTurnComplete: () => {
        // Turn fully done, persona will auto-advance to next
      },
      onRoundComplete: (roundNumber: number) => {
        setIsStreaming(false);
        setRoundComplete(true);
        setCurrentStreamingRole(null);
        setDebate((prev) =>
          prev ? { ...prev, current_round: roundNumber } : prev,
        );
        // Update round numbers on turns
        setTurns((prev) =>
          prev.map((t) =>
            t.round_number === 0 ? { ...t, round_number: roundNumber } : t,
          ),
        );
        // Persist round update locally
        updateDebateRound(debateId, roundNumber).catch(() => {});
      },
      onError: (err) => {
        setError(err.message);
        setIsStreaming(false);
        setCurrentStreamingRole(null);
      },
      onEnded: (_reason: string, message: string) => {
        setError(message);
        setIsStreaming(false);
        setCurrentStreamingRole(null);
        setDebate((prev) => (prev ? { ...prev, status: "completed" } : prev));
      },
    });

    streamRef.current = stream;
  }, []);

  const requestNextRound = useCallback(() => {
    if (!debate || isStreaming) return;
    startRound(String(debate.id));
  }, [debate, isStreaming, startRound]);

  const submitInterjection = useCallback(
    async (message: string, directedAt: string | null) => {
      if (!debate || isStreaming) return;
      try {
        setError(null);
        const result = await apiSubmitInterjection(String(debate.id), {
          message,
          directed_at: directedAt as Perspective | null,
        });
        // Add moderator turn to the list
        const moderatorTurn: DebateTurnState = {
          id: String(result.turn_id),
          turn_number: result.turn_number,
          role: "moderator",
          content: result.content,
          summary: null,
          citations: null,
          round_number: debate.current_round,
          created_at: new Date().toISOString(),
          isExpanded: true,
        };
        setTurns((prev) => [...prev, moderatorTurn]);
        setRoundComplete(false);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to submit interjection",
        );
      }
    },
    [debate, isStreaming],
  );

  const toggleTurnExpanded = useCallback((turnNumber: number) => {
    setTurns((prev) =>
      prev.map((t) =>
        t.turn_number === turnNumber ? { ...t, isExpanded: !t.isExpanded } : t,
      ),
    );
  }, []);

  return {
    debate,
    turns,
    isStreaming,
    currentStreamingRole,
    streamingContent,
    roundComplete,
    error,
    startDebate,
    resumeDebate,
    requestNextRound,
    submitInterjection,
    toggleTurnExpanded,
  };
}
