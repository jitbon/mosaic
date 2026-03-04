"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDebate } from "@/hooks/useDebate";
import { getPerspectives } from "@/lib/api";
import DebatePersonaSelector from "@/components/debate/DebatePersonaSelector";
import DebateTurn from "@/components/debate/DebateTurn";
import ModeratorInput from "@/components/debate/ModeratorInput";
import StreamingText from "@/components/chat/StreamingText";
import ErrorBanner from "@/components/common/ErrorBanner";
import type { Perspective, PerspectiveAvailabilityResponse } from "@/types/chat";
import type { DebateRole, DebateTurnData } from "@/types/debate";

const ROLE_LABELS: Record<DebateRole, string> = { persona_left: "Left", persona_center: "Center", persona_right: "Right", moderator: "Moderator" };
const ROLE_COLORS: Record<DebateRole, string> = { persona_left: "var(--color-left)", persona_center: "var(--color-center)", persona_right: "var(--color-right)", moderator: "var(--color-text-muted)" };

export default function DebateClient({ storyId }: { storyId: string }) {
  const id = Number(storyId);
  const [perspectives, setPerspectives] = useState<PerspectiveAvailabilityResponse | null>(null);
  const [selectedPersonas, setSelectedPersonas] = useState<Perspective[]>(["left", "right"]);
  const [starting, setStarting] = useState(false);
  const { debate, streaming, streamingText, streamingRole, roundComplete, error, start, runRound, interject, setStatus } = useDebate(id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getPerspectives(id).then(setPerspectives).catch(() => null); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [debate?.turns, streamingText]);

  async function handleStart() { setStarting(true); await start(selectedPersonas); setStarting(false); }

  const isActive = debate?.status === "active";
  const isCompleted = debate?.status === "completed";

  const turnsByRound: Record<number, DebateTurnData[]> = {};
  if (debate) { for (const turn of debate.turns) { if (!turnsByRound[turn.round_number]) turnsByRound[turn.round_number] = []; turnsByRound[turn.round_number].push(turn); } }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "12px 16px", backgroundColor: "var(--color-surface-bg)", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <Link href={`/story/${storyId}`} style={{ textDecoration: "none", color: "var(--color-primary)", fontSize: 14 }}>← Story</Link>
      </div>
      {error && <ErrorBanner message={error} />}
      {!debate ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <DebatePersonaSelector perspectives={perspectives} selected={selectedPersonas} onChange={setSelectedPersonas} onStart={handleStart} starting={starting} />
        </div>
      ) : (
        <>
          <div style={{ padding: "8px 12px", backgroundColor: "var(--color-surface-bg)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)", flex: 1 }}>Round {debate.current_round} · {debate.personas.join(" vs ")}</span>
            {isActive && <button onClick={() => setStatus("paused")} style={{ fontSize: 12, color: "var(--color-text-muted)", background: "none", border: "1px solid var(--color-border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Pause</button>}
            {!isCompleted && <button onClick={() => setStatus("completed")} style={{ fontSize: 12, color: "var(--color-error-text)", background: "none", border: "1px solid var(--color-error-text)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>End</button>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {Object.entries(turnsByRound).map(([round, turns]) => (
              <div key={round}>
                <div style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 0" }}>— Round {round} —</div>
                {turns.map((t) => <DebateTurn key={t.id} turn={t} />)}
              </div>
            ))}
            {streaming && streamingText && (
              <div style={{ margin: "8px 12px" }}>
                {streamingRole && <div style={{ fontSize: 12, fontWeight: 700, color: ROLE_COLORS[streamingRole as DebateRole], marginBottom: 4 }}>{ROLE_LABELS[streamingRole as DebateRole]}</div>}
                <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-border)", fontSize: 14, lineHeight: 1.6 }}>
                  <StreamingText text={streamingText} streaming />
                </div>
              </div>
            )}
            {roundComplete && !streaming && !isCompleted && (
              <div style={{ textAlign: "center", padding: "16px" }}>
                <button onClick={runRound} style={{ padding: "12px 32px", borderRadius: 10, border: "none", backgroundColor: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Next Round →</button>
              </div>
            )}
            {!streaming && !roundComplete && debate.turns.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px" }}>
                <button onClick={runRound} style={{ padding: "12px 32px", borderRadius: 10, border: "none", backgroundColor: "var(--color-primary)", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Start Round 1</button>
              </div>
            )}
            {isCompleted && <div style={{ textAlign: "center", padding: 16, color: "var(--color-text-muted)", fontSize: 14 }}>Debate completed</div>}
            <div ref={bottomRef} />
          </div>
          {isActive && !isCompleted && (
            <div style={{ flexShrink: 0 }}>
              <ModeratorInput onSubmit={(msg, directed) => interject({ message: msg, directed_at: directed })} disabled={streaming} personas={debate.personas} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
